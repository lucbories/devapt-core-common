// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T        from '../utils/types'
import Instance from '../base/instance'
import Stream   from './stream'


const context = 'common/messaging/message_bus'
const MAX_PAGE_SIZE = 999999
const MIN_PAGE_SIZE = 9



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
	 * 	 ->msg_recipients(arg_page_size=999999, arg_page_index=0):array - get paged recipients list.
	 *   ->msg_post(arg_msg:DistributedMessage):boolean - send a DistributedMessage instance.
	 * 
	 *   ->msg_subscribe(arg_channel:string, arg_handler:f(msg), arg_filter:string|object):unsubscribe function - subscribe to messages of the bus.
	 * 
	 *   ->msg_register(arg_distributed_instance,arg_channel,arg_method='receive_msg'):function - register a DistributedInstance recipient.
	 *   ->msg_has_recipient(arg_name):boolean - test if the bus has given named recipient.
	 *   ->msg_add_recipient(arg_name, arg_instance='remote') - add a bus recipient.
	 *   ->msg_remove_recipient(arg_name) - remove a bus recipient.
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
	 * Get paged recipients list.
	 * 
	 * @param {integer} arg_page_size  - recipients list page size.
	 * @param {integer} arg_page_index - recipients list page index.
	 * 
	 * @returns {object} - paged result { count:recipients count, page_size:..., page_count:..., page_index:..., page_values:[] }
	 */
	msg_recipients(arg_page_size=MAX_PAGE_SIZE, arg_page_index=0)
	{
		const recipients = Object.keys(this._recipients)
		const count = recipients.length
		const page  = T.isNumber(arg_page_size) && arg_page_size > MIN_PAGE_SIZE && arg_page_size < MAX_PAGE_SIZE ? arg_page_size : MAX_PAGE_SIZE
		const index = T.isNumber(arg_page_index) && arg_page_index >= 0 ? arg_page_index : 0

		const values = count <= page ? recipients : recipients.slice(index * page, page)
		return {
			count:count,
			page_size:page,
			page_count:Math.floor(count / page) + ( (count - Math.floor(count / page)) > 0 ? 1 : 0),
			page_index:index,
			page_values:values
		}
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
		
		// REGISTER RECIPIENT
		if ( T.isString(arg_filter) )
		{
			this.msg_add_recipient(arg_filter, undefined)
		}
		
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
			if ( this.msg_has_recipient( arg_msg.get_target() ) )
			{
				arg_handler(arg_msg)
				return
			}
			if ( T.isString(arg_filter) )
			{
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

		this.msg_add_recipient(name, arg_distributed_instance)
		
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


	/**
	 * Add a recipient.
	 * 
	 * @param {string} arg_name - recipient name.
	 * @param {DistributedInstance} arg_instance - distributed recipient instance (default:'remote').
	 * 
	 * @returns {nothing}
	 */
	msg_add_recipient(arg_name, arg_instance='remote')
	{
		assert( T.isNotEmptyString(arg_name), this.get_context() + ':msg_add_recipient:bad recipient name [' + arg_name + '].')
		assert( arg_instance=='remote' || T.isObject(arg_instance) && arg_instance.is_distributed_instance, this.get_context() + ':msg_add_recipient:bad distributed instance.')
		
		if (arg_name in this._recipients)
		{
			return
		}

		this._recipients[arg_name] = arg_instance
	}


	/**
	 * Remove a recipient.
	 * 
	 * @param {string} arg_name - recipient name.
	 * 
	 * @returns {nothing}
	 */
	msg_remove_recipient(arg_name)
	{
		assert( T.isNotEmptyString(arg_name), this.get_context() + ':msg_add_recipient:bad recipient name [' + arg_name + '].')
		
		if (arg_name in this._recipients)
		{
			delete this._recipients[arg_name]
		}
	}
}