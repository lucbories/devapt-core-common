// NPM IMPORTS
import assert from 'assert'
import {format} from 'util'

// COMMON IMPORTS
import T                  from '../utils/types'
import Instance           from '../base/instance'
import DistributedMessage from '../base/distributed_message'
import DistributedLogs    from '../base/distributed_logs'
import DistributedMetrics from '../base/distributed_metrics'
import Stream             from './stream'


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
	 *   ->normalize_msg(arg_msg):DistributedMessage|undefined - Normalize given message.
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
		
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_message_bus = true

		this._bus_engine = arg_bus_engine

		this._input_stream = new Stream()

		this._recipients = {}
		this._recipients_handlers = {}
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
		try{
			assert( T.isObject(arg_msg) && arg_msg.is_distributed_message, this.get_context() + ':msg_post:bad message instance')
			assert( T.isObject(this._bus_engine) && this._bus_engine.is_bus_engine, this.get_context() + ':msg_post:bad message instance')
			
			const channel = arg_msg.get_channel()
			assert( T.isString(channel), this.get_context() + ':msg_post:bad channel name')

			// ADD BUS NAME TO MESSAGE PATH
			const step_name = this.get_name()
			if (arg_msg.has_buses_step(step_name))
			{
				// DEBUG
				const payload_str = JSON.stringify(arg_msg.get_payload())
				this.debug( format('msg_post:bus step exists:engine=[%s] step=[%s] channel=[%s] sender=[%s] target=[%s] data=[%s]', this.get_name(), step_name, arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target(), payload_str) )
				// console.log(context + ':msg_post:bus step exists:engine=[%s] step=[%s] channel=[%s] sender=[%s] target=[%s] data=[%s]', this.get_name(), step_name, arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target(), payload_str)
				
				return false
			}
			arg_msg.add_buses_step(step_name)

			// DEBUG
			const payload_str = JSON.stringify(arg_msg.get_payload())
			this.debug( format('msg_post:new bus step:engine=[%s] step=[%s] channel=[%s] sender=[%s] target=[%s] data=[%s]', this.get_name(), step_name, arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target(), payload_str) )
			// console.log(context + ':msg_post:new bus step:engine=[%s] step=[%s] channel=[%s] sender=[%s] target=[%s] data=[%s]', this.get_name(), step_name, arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target(), payload_str)
			
			// LOCAL RECIPIENT
			const recipient_is_local = this.msg_has_recipient(arg_msg.get_target())
			if (recipient_is_local)
			{
				const recipient = this._recipients[arg_msg.get_target()]
				if ( T.isObject(recipient) || recipient == 'browser' )
				{
					this.debug( format('msg_post:recipient is local and is an instance or browser:engine=[%s] step=[%s] channel=[%s] sender=[%s] target=[%s]', this.get_name(), step_name, arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target() ) )
					const handler = this._recipients_handlers[arg_msg.get_target()]
					if ( T.isFunction(handler) )
					{
						handler(arg_msg)
						return true
					}
					
					console.warn(context + ':msg_post:failure with error:not or bad handler for local recipient')
					return false
				}

				this.debug( format('msg_post:recipient is local but not an instance:engine=[%s] step=[%s] channel=[%s] sender=[%s] target=[%s]', this.get_name(), step_name, arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target() ) )
			}

			// REMOTE RECIPIENT
			this._bus_engine.channel_send(channel, arg_msg)

			return true
		} catch(e) {
			console.warn(context + ':msg_post:failure with error:' + e)
			return false
		}
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
		
		// DEBUG
		// debugger
		this.debug( format('msg_subscribe:engine=[%s] filter=[%s] channel=[%s]', this.get_name(), arg_filter, arg_channel) )
		// console.log(context + ':msg_subscribe:same channel:engine=[%s] filter=[%s] channel=[%s]', this.get_name(), arg_filter, arg_channel)

		// REGISTER RECIPIENT
		if ( T.isString(arg_filter) )
		{
			this.msg_add_recipient(arg_filter, undefined)
		}
		
		// MESSAGE HANDLER
		const msg_handler = (arg_msg)=>{
			arg_msg = this.normalize_msg(arg_msg)

			// DEBUG
			// debugger

			// CHANNEL NAME FILTERING
			const channel = arg_msg.get_channel()
			assert( T.isNotEmptyString(channel), this.get_context() + ':msg_subscribe:msg_handler:bad channel name')
			const same_channel = channel == arg_channel

			// DEBUG
			this.debug( format('msg_subscribe:same channel:engine=[%s] filter=[%s] channel=[%s] handler channel=[%s] same channel[%d]', this.get_name(), arg_filter, channel, arg_channel, same_channel) )
			// console.log(context + ':msg_subscribe:same channel:engine=[%s] filter=[%s] channel=[%s] handler channel=[%s] same channel[%d]', this.get_name(), arg_filter, channel, arg_channel, same_channel)
				
			if (! same_channel)
			{
				// DEBUG
				this.debug( format('msg_subscribe:skip channel:engine=[%s] filter=[%s] channel=[%s] sender=[%s] target=[%s] handler channel=[%s]', this.get_name(), arg_filter, channel, arg_msg.get_sender(), arg_msg.get_target(), arg_channel) )
				// console.log(context + ':msg_subscribe:skip channel:engine=[%s] filter=[%s] channel=[%s] sender=[%s] target=[%s] handler channel=[%s]', this.get_name(), arg_filter, channel, arg_msg.get_sender(), arg_msg.get_target(), arg_channel)
				return
			}

			// TARGET NAME FILTERING
			if ( T.isNotEmptyString(arg_filter) && arg_filter != arg_msg.get_target() )
			{
				// DEBUG
				this.debug( format('msg_subscribe:skip target:engine=[%s] filter=[%s] channel=[%s] sender=[%s] target=[%s] handler channel=[%s]', this.get_name(), arg_filter, channel, arg_msg.get_sender(), arg_msg.get_target(), arg_channel) )
				// console.log(context + ':msg_subscribe:skip target:engine=[%s] filter=[%s] channel=[%s] sender=[%s] target=[%s] handler channel=[%s]', this.get_name(), arg_filter, channel, arg_msg.get_sender(), arg_msg.get_target(), arg_channel)
				return
			}
			if ( this.msg_has_recipient( arg_msg.get_target() ) )
			{
				// DEBUG
				const payload_str = JSON.stringify(arg_msg.get_payload())
				this.debug( format('msg_subscribe:msg handled with filter:engine=[%s] filter=[%s] channel=[%s] sender=[%s] target=[%s] data=[%s]', this.get_name(), arg_filter, arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target(), payload_str) )
				// console.log(context + ':msg_subscribe:msg handled with filter:engine=[%s] filter=[%s] channel=[%s] sender=[%s] target=[%s] data=[%s]', this.get_name(), arg_filter, arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target(), payload_str)
				
				arg_handler(arg_msg)
				return
			}

			// NO FILTERING
			// DEBUG
			const payload_str = JSON.stringify(arg_msg.get_payload())
			this.debug( format('msg_subscribe:msg handled without filter:engine=[%s] filter=[%s] channel=[%s] sender=[%s] target=[%s] data=[%s]', this.get_name(), '', arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target(), payload_str) )
			// console.log(context + ':msg_subscribe:msg handled without filter:engine=[%s] filter=[%s] channel=[%s] sender=[%s] target=[%s] data=[%s]', this.get_name(), '', arg_msg.get_channel(), arg_msg.get_sender(), arg_msg.get_target(), payload_str)
			
			arg_handler(arg_msg)
		}
		
		if ( T.isString(arg_filter) && arg_filter in this._recipients_handlers )
		{
			this._recipients_handlers[arg_filter] = msg_handler
		}

		const fn_filter = T.isFunction(arg_filter) ? arg_filter : undefined
		const str_filter = T.isString(arg_filter) ? (msg)=>{ return arg_filter == msg._target } : undefined
		const predicate = fn_filter || str_filter
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

		// DEBUG
		this.debug( format('msg_register:engine=[%s] instance=[%s] channel=[%s] method=[%s]', this.get_name(), name, arg_channel, arg_method) )
		// console.log(context + ':msg_register:engine=[%s] instance=[%s] channel=[%s] method=[%s]', this.get_name(), name, arg_channel, arg_method)

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
		assert( arg_instance=='browser' || arg_instance=='remote' || T.isObject(arg_instance) && arg_instance.is_distributed_instance, this.get_context() + ':msg_add_recipient:bad distributed instance.')
		
		if (arg_name in this._recipients)
		{
			return
		}

		this._recipients[arg_name] = arg_instance
		this._recipients_handlers[arg_name] = ()=>{}
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
			delete this._recipients_handlers[arg_name]
		}
	}


	/**
	 * Normalize given message.
	 * 
	 * @param {object} arg_msg - message to normalize.
	 * 
	 * @returns {DistributedMessage|undefined} - normalized message.
	 */
	normalize_msg(arg_msg)
	{
		if (! T.isObject(arg_msg) || ! arg_msg.is_distributed_message)
		{
			return undefined
		}

		if ( T.isFunction(arg_msg.get_channel) )
		{
			return arg_msg
		}

		if ( arg_msg.is_distributed_logs)
		{
			return new DistributedLogs(arg_msg)
		}

		if ( arg_msg.is_distributed_metrics)
		{
			return new DistributedMetrics(arg_msg)
		}

		return new DistributedMessage(arg_msg)
	}
}