// NPM IMPORTS
import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import T               from '../utils/types'
import Instance        from '../base/instance'
import Stream          from '../messaging/stream'
import ServiceResponse from './service_response'


let context = 'common/services/service_provider'



/**
 * Service provider base class.
 * @abstract
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class ServiceProvider extends Instance
{
	/**
	 * Create a service provider.
	 * 
	 * 	API:
	 * 		->load():nothing - Load settings.
	 * 
	 * 		->activate(arg_application, arg_server, arg_app_svc_cfg):nothing - Activate a service feature for an application.
	 * 
	 * 		->produce():Promise - Produce service datas on request.
	 * 
	 * 		->get_host():string - Get host name of service server.
	 * 		->get_port():number - Get host port of service server.
	 * 
	 * @param {string} arg_provider_name - consumer name.
	 * @param {Service} arg_service_instance - service instance.
	 * @param {string} arg_context - logging context label.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_provider_name, arg_service_instance, arg_context)
	{
		assert( T.isString(arg_provider_name), context + ':bad provider name string')
		assert( T.isObject(arg_service_instance) && arg_service_instance.is_service, context + ':bad service object')
		
		super('svc_providers', 'ServiceProvider', arg_provider_name, arg_service_instance.get_settings(), arg_context ? arg_context : context)
		
		this.is_service_provider = true
		
		this.service = arg_service_instance
		this.server = null
		this.application = null
		this.application_server = null

		
		// CREATE A STREAM WHICH RECEIVE VALUES TO SEND TO SUBSCRIBERS
		this.subscribers_sockets = []
		this.provided_values_stream = new Stream()
		if ( T.isFunction(this.init_provided_values_stream) )
		{
			this.init_provided_values_stream()
		}

		// ENABLE SEND VALUES TO SUBSCRIBERS HANDLER
		const post_cb = (v) => {
			// console.log(context + ':on stream value for provider %s',  arg_provider_name)
			this.post_provided_values_to_subscribers(v)
		}
		this.provided_values_stream.subscribe(post_cb)
	}
	
	

	/**
	 * Load settings.
	 * @abstract
	 * 
	 * @returns {nothing}
	 */
	load()
	{
		// const provider_operations = this.get_operations_names()

		// this._operations = ['devapt-connect', 'devapt-disconnect',
		// 	'devapt-subscribe', 'devapt-unsubscribe',
		// 	'end', 'devapt-ping'].concat(provider_operations)
	}



	/**
	 * Get provider operations names.
	 * @abstract
	 * 
	 * @returns {array}
	 */
	get_operations_names()
	{
		return ['devapt-disconnect', 'devapt-subscribe', 'devapt-unsubscribe']
	}


	
	/**
	 * Produce service datas on request.
	 * 
	 * @param {ServiceRequest} arg_request - service request instance.
	 * 
	 * @returns {Promise} - promise of ServiceResponse instance.
	 */
	produce(arg_request)
	{
		const operation = arg_request.get_operation()
		const response = new ServiceResponse(arg_request)

		// SUBSCRIBE TO PROVIDER STREAM DATAS
		if (operation == 'devapt-disconnect')
		{
			const socket = arg_request.get_socket()
			
			if (socket)
			{
				this.unsubscribe(socket)
				socket.disconnect(0)
				response.set_results(['done'])
				return Promise.resolve(response)
			}
			
			response.set_results([ { error:'bad socket' } ])
			return Promise.resolve(response)
		}

		// SUBSCRIBE TO PROVIDER STREAM DATAS
		if (operation == 'devapt-subscribe')
		{
			const socket = arg_request.get_socket()
			
			if (socket)
			{
				this.subscribe(socket)
				response.set_results(['done'])
				return Promise.resolve(response)
			}
			
			response.set_results([ { error:'bad socket' } ])
			return Promise.resolve(response)
		}

		// UNSUBSCRIBE FROM PROVIDER STREAM DATAS
		if (operation == 'devapt-unsubscribe')
		{
			const socket = arg_request.get_socket()
			
			if (socket)
			{
				this.unsubscribe(socket)
				response.set_results(['done'])
				return Promise.resolve(response)
			}

			response.set_results([ { error:'bad socket' } ])
			return Promise.resolve(response)
		}

		response.set_results([ { error:'operation not found' } ])
		return Promise.resolve(response)
	}
	

    
	/**
	 * Get host name of service server.
	 * 
	 * @returns {string} - service host name
	 */
	get_host()
	{
		return this.server.server_host
	}
	

	
	/**
	 * Get host port of service server.
	 * 
	 * @returns {number} - service host port
	 */
	get_port()
	{
		return this.server.server_port
	}
	
	
	
	/**
	 * Add a subscriber socket.
	 * 
	 * @param {object} arg_socket - subscribing socket.
	 * 
	 * @returns {nothing}
	 */
	subscribe(arg_socket)
	{
		// const svc_name = this.service.get_name()
		// console.info(context + ':subscribe:socket subscribe on /' + svc_name, arg_socket.id)
		
		this.subscribers_sockets.push(arg_socket)
	}
	
	
	
	/**
	 * Remove a subscriber socket.
	 * 
	 * @param {object} arg_socket - subscribing socket.
	 * 
	 * @returns {nothing}
	 */
	unsubscribe(arg_socket)
	{
		// const svc_name = this.service.get_name()

		_.remove(this.subscribers_sockets, (socket)=>{ socket.id == arg_socket.id } )
	}
	
	
	
	/**
	 * Post a message on the bus.
	 * 
	 * @param {object} arg_msg - message payload.
	 * 
	 * @returns {nothing}
	 */
	post_provided_values_to_subscribers(arg_datas)
	{
		const svc_name = this.service.get_name()
		// console.log(context + ':post:emit datas for ' + svc_name + ' with subscribers:' + this.subscribers_sockets.length)
		this.subscribers_sockets.forEach(
			(socket) => {
				// console.log(context + ':post:emit datas for ' + svc_name)
				socket.emit('post', { service:svc_name, operation:'post', result:'done', datas:arg_datas })
			}
		)
	}
}
