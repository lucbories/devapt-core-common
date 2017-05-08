// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T        from '../utils/types'
import Instance from '../base/instance'
import Stream   from './stream'


let context = 'common/messaging/message_bus'



/**
 * @file Message bus class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class MessageBus extends Instance
{
	/**
	 * Create a bus.
	 * 
	 * API:
	 *   ->constructor(arg_name, arg_settings, arg_log_context).
	 * 
	 * 	Engine API:
	 *   ->get_bus_engine():BusEngine
	 * 
	 *  Stream API:	
	 *   ->get_input_stream():Stream - get input stream to populate the bus.
	 * 
	 * 	Message API:
	 *   ->msg_post(arg_msg:DistributedMessage):boolean - send a DistributedMessage instance.
	 *   ->msg_subscribe(arg_filter:string|object, arg_handler:f(msg)):nothing - subscribe to messages of the bus.
	 *   ->msg_register(arg_distributed_instance):function - register a DistributedInstance recipient.
	 *   ->msg_has_recipient(arg_name):boolean - test if the bus has given named recipient.
	 * 
	 * @param {string}    arg_name - instance name.
	 * @param {BusEngine} arg_bus_engine - bus engine.
	 * @param {object}    arg_settings - settings.
	 * @param {string}    arg_log_context - trace context.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_name, arg_bus_engine, arg_settings, arg_log_context)
	{
		super('buses', 'MessageBus', arg_name, arg_settings, arg_log_context ? arg_log_context : context)
		
		this.is_message_bus = true

		this._bus_engine = arg_bus_engine
		this._input_stream = new Stream()
		this._recipients = {}
	}
	

	
	/**
	 * Get bus engine.
	 * 
	 * @returns {BusEngine}
	 */
	get_bus_engine()
	{
		assert( T.isObject(this._bus_engine) && this._bus_engine.is_bus_engine, this.get_context() + ':get_bus_engine:bad bus engine instance')
		return this._bus_engine
	}
	
	
	
	/**
	 * Get stream to populate the bus.
	 * 
	 * @returns {Stream} - input bus stream.
	 */
	get_input_stream()
	{
		return this._input_stream
	}



	/**
	 * Send a message into a channel.
	 * 
	 * @param {DistributedMessage} arg_msg - distributed message instance.
	 * 
	 * @returns {boolean} - success or failure.
	 */
	msg_post(arg_msg)
	{
		assert( T.isObject(arg_msg) && arg_msg.is_distributed_message, this.get_context() + ':msg_post:bad message instance')
		assert( T.isObject(this._bus_engine) && this._bus_engine.is_bus_engine, this.get_context() + ':msg_post:bad message instance')
		const channel = arg_msg.get_channel()
		assert( T.isString(channel), this.get_context() + ':msg_post:bad channel name')
		this._bus_engine.channel_send(channel, arg_msg)
	}
	
	
	
	/**
	 * Subscribe on channel inputs.
	 * 
	 * @param {string} arg_channel - channel name string.
	 * @param {function} arg_handler - f(payload)
	 * @param {string|function} arg_filter - filter string or function.
	 * 
	 * @returns {function} - unsubscribe function.
	 */
	msg_subscribe(arg_channel, arg_handler, arg_filter=undefined)
	{
		assert( T.isFunction(arg_handler), this.get_context() + ':msg_subscribe:bad handler function')
		assert( T.isObject(this._bus_engine) && this._bus_engine.is_bus_engine, this.get_context() + ':msg_subscribe:bad bus engine instance')
		
		// MESSAGE HANDLER
		const msg_handler = (arg_msg)=>{
			// CHANNEL NAME FILTERING
			const channel = arg_msg.get_channel()
			assert( T.isString(channel), this.get_context() + ':msg_subscribe:msg_handler:bad channel name')
			if (channel != arg_channel)
			{
				return
			}

			// TARGET NAME FILTERING
			if ( T.isString(arg_filter) )
			{
				if (arg_msg.get_target() == arg_filter)
				{
					arg_handler(arg_msg)
				}
				return
			}

			// NO FILTERING
			arg_handler(arg_msg)
		}
		
		const predicate = T.isFunction(arg_filter) ? arg_filter : undefined
		return this._bus_engine.channel_on(arg_channel, msg_handler, predicate)
	}



	/**
	 * Register a DistributedInstance recipient.
	 * 
	 * @param {DistributedInstance} arg_distributed_instance - distributed recipient instance.
	 * @param {string} arg_channel - channel name string.
	 * @param {string} arg_method - message handler method name string.
	 * 
	 * @returns {function} - unsubscribe function.
	 */
	msg_register(arg_distributed_instance, arg_channel, arg_method='receive_msg')
	{
		assert( T.isObject(arg_distributed_instance) && arg_distributed_instance.is_distributed_instance, this.get_context() + ':msg_register:bad distributed instance.')
		assert( T.isString(arg_method) && (arg_method in arg_distributed_instance), this.get_context() + ':msg_register:bad method name [' + arg_method + '].')
		const name = arg_distributed_instance.get_name()
		const handler = arg_distributed_instance[arg_method].bind(arg_distributed_instance)
		this._recipients[name] = arg_distributed_instance
		return this.msg_subscribe(arg_channel, handler, name)
	}



	/**
	 * Test if bus has given named recipient.
	 * 
	 * @param {arg_name} arg_name - recipient name.
	 * 
	 * @returns {boolean}
	 */
	msg_has_recipient(arg_name)
	{
		return T.isString(arg_name) && (arg_name in this._recipients)
	}
}