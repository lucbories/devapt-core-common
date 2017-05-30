// NPM IMPORTS
import assert from 'assert'
// import _ from 'lodash'

// COMMON IMPORTS
import T               from '../utils/types'
// import Instance        from '../base/instance'
// import Stream          from '../messaging/stream'
import StreamsProvider    from '../messaging/streams_provider'
import ServiceResponse from './service_response'


const context = 'common/services/service_provider'



/**
 * Service provider base class.
 * @abstract
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
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
 */
export default class ServiceProvider extends StreamsProvider
{
	/**
	 * Create a service provider.
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
		/*
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
		*/

		this.add_stream('default')
	}
	
	

	/**
	 * Load settings.
	 * @abstract
	 * 
	 * @returns {nothing}
	 */
	load()
	{
	}



	/**
	 * Get provider operations names.
	 * @abstract
	 * 
	 * @returns {array}
	 */
	get_operations_names()
	{
		return ['devapt-disconnect', 'devapt-subscribe', 'devapt-unsubscribe', 'devapt-subscription']
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
		const operands = arg_request.get_operands()
		const response = new ServiceResponse(arg_request)
		const opd_1 = operands.length > 0 ? operands[0] : undefined
		const opd_1_str = T.isNotEmptyString(opd_1) ? opd_1 : 'default'

		// SUBSCRIBE TO PROVIDER STREAM DATAS
		if (operation == 'devapt-disconnect')
		{
			const socket = arg_request.get_socket()
			
			if (socket)
			{
				this.unsubscribe(opd_1_str, socket)
				socket.disconnect(0)

				response.set_results( ['done'].concat(operands) )
				return Promise.resolve(response)
			}
			
			response.set_results( [ { error:'bad socket' } ].concat(operands) )
			return Promise.resolve(response)
		}

		// SUBSCRIBE TO PROVIDER STREAM DATAS
		if (operation == 'devapt-subscribe')
		{
			const socket = arg_request.get_socket()
			
			if (socket)
			{
				this.subscribe(opd_1_str, socket)

				response.set_results( ['done'].concat(operands) )
				return Promise.resolve(response)
			}
			
			response.set_results([ { error:'bad socket' } ].concat(operands) )
			return Promise.resolve(response)
		}

		// UNSUBSCRIBE FROM PROVIDER STREAM DATAS
		if (operation == 'devapt-unsubscribe')
		{
			const socket = arg_request.get_socket()
			
			if (socket)
			{
				this.unsubscribe(opd_1_str, socket)
				response.set_results( ['done'].concat(operands) )
				return Promise.resolve(response)
			}

			response.set_results( [ { error:'bad socket' } ].concat(operands) )
			return Promise.resolve(response)
		}

		// SUBSCRIPTION
		if (operation == 'devapt-subscription')
		{
			response.set_results(operands)
			return Promise.resolve(response)
		}

		response.set_has_error(true)
		response.set_error('produce:error:operation failure [' + operation + '] not found')
		response.set_results(undefined)
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
	 * Post streams values to one subscriber.
	 * 
	 * @param {object} arg_subscriber - subscriber object.
	 * @param {string} arg_stream_name - stream name.
	 * @param {object} arg_datas - response values.
	 * 
	 * @returns {nothing}
	 */
	post_to_subscriber(arg_subscriber, arg_stream_name, arg_datas)
	{
		console.log(context + ':post_to_subscriber:stream=[%s] subscriber=', arg_stream_name, arg_subscriber)
		console.log(context + ':post_to_subscriber:stream=[%s] datas=', arg_stream_name, arg_datas)

		const svc_name = this.service.get_name()
		arg_subscriber.emit('devapt-subscription', { service:svc_name, operation:'devapt-subscription', results:['done', arg_datas] })
	}
}
