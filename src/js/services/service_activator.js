// NPM IMPORTS
import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import T               from '../utils/types'
import { is_server }   from '../utils/is_browser'
import Credentials     from '../base/credentials'
import ServiceRequest  from './service_request'
import ServiceResponse from './service_response'


let context = 'common/services/service_activator'



/**
 * Service activator class.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class ServiceActivator
{
	/**
	 * Create a service provider.
	 * 
	 * 	API:
	 * 		->activate(arg_application, arg_server, arg_app_svc_cfg):nothing - Activate a service feature for an application.
	 * 
	 * @param {Service} arg_service_instance - service instance.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_service_instance)
	{
		assert( T.isObject(arg_service_instance) && arg_service_instance.is_service, context + ':bad service object')
		
		this.is_service_activator = true
		
		this.service = arg_service_instance
	}
	
	

	/**
	 * Activate a service feature for an application.
	 * 
	 * @param {ServiceProvider} arg_provider - service provider instance.
	 * @param {Application}     arg_application - application instance.
	 * @param {Server}          arg_server - server instance to bind the service.
	 * 
	 * @returns {nothing}
	 */
	activate(arg_provider, arg_application, arg_server)
	{
		assert(T.isObject(arg_application), context + ':bad application object')
		assert(T.isObject(arg_server) && arg_server.is_server, context + ':bad server object')
		
		assert( arg_provider.server == null, context + ': already activated')
		assert( arg_provider.application == null, context + ': already activated')
		
		assert( is_server(), context + ':service activation is only available on server')
		
		// console.log(context + ':activate:app=' + arg_application.get_name())
		// console.log(context + ':activate:server=' + arg_server.get_name())
		
		arg_provider.server = arg_server
		arg_provider.application = arg_application
		arg_provider.application_server = arg_application.get_name() + '-' + arg_server.get_name()

		// ACTIVATE ON SOCKETIO
		if (arg_server.serverio)
		{
			// console.log(context + ':activate:with socketio')

			this.activate_on_socketio_server(arg_provider, arg_server.serverio)
		}

		// ACTIVATE WITH EXECUTABLE
		if ( T.isObject(arg_provider.exec) && arg_provider.exec.is_executable )
		{
			const routes = arg_provider.get_setting_js('routes')
			// console.log(context + ':activate:with routes', routes)

			if ( T.isNotEmptyArray(routes) )
			{
				const exec_cfg = {
					'routes':routes,
					'server':arg_server
				}
				arg_provider.set_setting('routes', routes)
				arg_provider.exec.prepare(exec_cfg)
				arg_provider.exec.execute(arg_application)
			}
		}
	}



	/**
	 * Activate service on one socketio server for browser request with messages.
	 * 
	 * @param {ServiceProvider} arg_provider - service provider instance.
	 * @param {object} arg_socketio - socketio server.
	 * 
	 * @returns {nothing}
	 */
	activate_on_socketio_server(arg_provider, arg_socketio)
	{
		const runtime = arg_provider.get_runtime()
		const svc_name = arg_provider.service.get_name()
		const serverio_svc = arg_socketio.of(svc_name)
		
		console.log(context + ':activate_on_socketio_server:svc=' + svc_name + ':socket.id=' + serverio_svc.name)
		
		const no_credentials_ops = ['devapt-login', 'devapt-subscribe', 'devapt-unsubscribe', 'devapt-disconnect', 'end', 'devapt-ping', 'devapt-connect']

		const error_values = {
			service:svc_name,
			operation:'unknow',
			has_error:true,
			error:'error?'
		}
		
		const with_credentials_fn = (op_name, socket)=>{
			// console.log(context + ':activate_on_socketio_server:with_credentials_fn:svc=' + svc_name + ':socket.id=' + serverio_svc.name + ' enable operation [' + op_name + '] with credentials')
			
			return (arg_request_plain_object) => {
				// console.log(context + ':activate_on_socketio_server:svc=' + svc_name + ':socket.id=' + serverio_svc.name + ' requested operation [' + op_name + '] with credentials')

				const request = new ServiceRequest(arg_request_plain_object)
				request.set_socket(socket)

				// CHECK REQUEST
				if ( ! T.isObject(request) || ! request.is_service_request)
				{
					error_values.operation = op_name
					error_values.error = 'bad request object'
					const response = new ServiceResponse(error_values)
					socket.emit(op_name, response.get_properties_values())
					arg_provider.error('bad credentials')
					console.error(context + ':activate_on_socketio_server:bad request for method %s of svc %s with data:', op_name, svc_name)
					return
				}

				// CHECK CREDENTIALS
				if ( ! request.has_credentials() )
				{
					error_values.operation = op_name
					error_values.error = 'security failure:no credentials'
					const response = new ServiceResponse(error_values)
					socket.emit(op_name, response.get_properties_values())
					arg_provider.error('bad credentials')
					console.error(context + ':activate_on_socketio_server:bad credentials for method %s of svc %s with data:', op_name, svc_name)
					return
				}
				
				// TEST SECURITY
				// console.log(context + ':on: svc=%s op=%s :arg_credentials', svc_name, key, data.credentials.username)
				const credentials = new Credentials(request.get_credentials())
				runtime.security().authenticate(credentials)
				.then(
					(authenticate_result) => {
						if (authenticate_result)
						{
							arg_provider.debug('authentication success')
							// console.log(context + 'authentication success')
							
							const permission = { resource:svc_name, operation:op_name }
							let authorization_promise = runtime.security().authorize(permission, credentials)
							return authorization_promise.then(
								(authorize_result) => {
									// console.log(context + ':authorize_result', authorize_result)
									if (authorize_result)
									{
										arg_provider.debug('authorization success')
										// console.log(context + ':authorization success')
										const response_promise = arg_provider.produce(request)
										response_promise.then(
											(response)=>{
												socket.emit(op_name,  response.get_properties_values())
											}
										)
										return true
									}
									
									arg_provider.debug('authorization failure')
									console.log(context + ':authorization failure')

									error_values.operation = op_name
									error_values.error = 'security failure:authorization refused'
									const response = new ServiceResponse(error_values)
									socket.emit(op_name, response.get_properties_values())
									return false
								}
							)
							.catch(
								(reason) => {
									arg_provider.debug('authorization error:' + reason)
									console.error(context + ':authorization error:' + reason)

									error_values.operation = op_name
									error_values.error = 'security failure:authorization exception:' + reason
									const response = new ServiceResponse(error_values)
									socket.emit(op_name, response.get_properties_values())
								}
							)
						}
						
						arg_provider.debug('authentication failure')
						console.log(context + 'authentication failure')

						error_values.operation = op_name
						error_values.error = 'security failure:authentication refused'
						const response = new ServiceResponse(error_values)
						socket.emit(op_name, response.get_properties_values())
						return
					}
				)
				.catch(
					(reason) => {
						arg_provider.debug('authentication error:' + reason) // TODO NOT ONLY AUTHORIZ. ERROR
						console.log(context + 'authentication error:' + reason)

						error_values.operation = op_name
						error_values.error = 'security failure:authentication exception:' + reason
						const response = new ServiceResponse(error_values)
						socket.emit(op_name, response.get_properties_values())
					}
				)
			}
		}
		
		const no_credentials_fn = (op_name, socket)=>{
			// console.log(context + ':activate_on_socketio_server:no_credentials_fn:svc=' + svc_name + ':socket.id=' + serverio_svc.name + ' enable operation [' + op_name + '] without credentials')

			return (arg_request_plain_object)=>{
				// console.log(context + ':activate_on_socketio_server:svc=' + svc_name + ':socket.id=' + serverio_svc.name + ' requested operation [' + op_name + '] without credentials')
				// console.log(context + ':activate_on_socketio_server:request', arg_request_plain_object)
				
				const request = new ServiceRequest(arg_request_plain_object)
				request.set_socket(socket)
				
				// CHECK REQUEST
				if ( ! T.isObject(request) || ! request.is_service_request)
				{
					error_values.operation = op_name
					error_values.error = 'bad request object'
					const response = new ServiceResponse(error_values)
					socket.emit(op_name, response.get_properties_values())
					arg_provider.error('bad credentials')
					console.error(context + ':activate_on_socketio_server:bad request for operation %s of svc %s with data:', op_name, svc_name)
					return
				}

				const response_promise = arg_provider.produce(request)
				response_promise.then(
					(response)=>{
						// console.log(context + ':activate_on_socketio_server:svc=' + svc_name + ':socket.id=' + serverio_svc.name + ' reply to operation [' + op_name + '] without credentials with response', response.get_properties_values())
						socket.emit(op_name,  response.get_properties_values())
					}
				)
			}
		}

		serverio_svc.on('connection',
			(socket) => {
				arg_provider.info('activate_on_socketio_server:new connection on /' + svc_name, socket.id)
				
				const ops = arg_provider.get_operations_names()
				_.forEach(ops, 
					(op_name) => {
						// socket.join(socket.id)

						if ( no_credentials_ops.indexOf(op_name) > -1 )
						{
							console.log(context + ':activate_on_socketio_server:svc=[%s] serverio.name=[%s] socket.id=[%s] enable operation=[%s] without credentials', svc_name, serverio_svc.name, socket.id, op_name)

							socket.on(op_name, no_credentials_fn(op_name, socket))
							return
						}

						console.log(context + ':activate_on_socketio_server:svc=[%s] serverio.name=[%s] socket.id=[%s] enable operation=[%s] with credentials', svc_name, serverio_svc.name, socket.id, op_name)
						
						socket.on(op_name, with_credentials_fn(op_name, socket))
					}
				)
			}
		)
	}
}
