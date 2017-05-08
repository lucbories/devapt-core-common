// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T        from '../utils/types'
import BusEngine from './bus_engine'
import Stream   from './stream'


let context = 'common/messaging/stream_bus_engine'



/**
 * @file Base class for message bus client or server.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class StreamBusEngine extends BusEngine
{
	/**
	 * Create a bus.
	 * 
	 * API:
	 *   ->constructor(arg_name, arg_settings, arg_log_context).
	 * 
	 *   ->channel_add(arg_channel)
	 *   ->channel_send(arg_channel, arg_payload)
	 *   ->channel_on(arg_channel, arg_handler)
	 *   ->channel_transform(arg_in_channel, arg_out_channel, arg_xform_handler).
	 * 
	 * @param {string} arg_name - instance name.
	 * @param {object} arg_settings - settings.
	 * @param {string} arg_log_context - trace context.
	 * @param {LoggerManager} arg_logger_manager - logger manager object (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_name, arg_settings, arg_log_context=context, arg_logger_manager=undefined)
	{
		super(arg_name, arg_settings, arg_log_context, arg_logger_manager)
		
		this.is_stream_bus_engine = true
		
		this._channels = {}
		this._channels['default'] = new Stream()
	}
	

	
	/**
	 * Add a channel.
	 * 
	 * @param {string} arg_channel - channel name.
	 * 
	 * @returns {nothing}
	 */
	channel_add(arg_channel)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_add:bad channel name')
		this._channels[arg_channel] = new Stream()
	}



	/**
	 * Send a message into a channel.
	 * 
	 * @param {string} arg_channel - channel name string.
	 * 
	 * @returns {Stream} - input bus stream
	 */
	channel_send(arg_channel, arg_payload)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_send:bad channel name')
		assert( arg_payload, this.get_context() + ':channel_send:bad payload data')
		assert( arg_channel in this._channels, this.get_context() + ':channel_send:channel stream not found')
		this._channels[arg_channel].push(arg_payload)
	}
	
	
	
	/**
	 * Subscribe on channel inputs.
	 * 
	 * @param {string} arg_channel - channel name string.
	 * @param {function} arg_handler - f(payload):nothing
	 * @param {function} arg_predicate - p(payload):boolean
	 * 
	 * @returns {Stream} - input bus stream
	 */
	channel_on(arg_channel, arg_handler, arg_predicate=undefined)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_on:bad channel name')
		assert( T.isFunction(arg_handler), this.get_context() + ':channel_on:bad handler function')
		assert( arg_channel in this._channels, this.get_context() + ':channel_on:channel stream not found')
		this._channels[arg_channel].subscribe(
			(value) => {
				// console.log(context + ':subscribe:received value', value)
				
				// FILTER BY PREDICATE
				if ( T.isFunction(arg_predicate) && arg_predicate(value) )
				{
					arg_handler(value)
					return
				}
				
				// NO VALID PREDICATE
				arg_handler(value)
			}
		)
	}



	/**
	 * Transform payload of input channel to output channel.
	 * 
	 * @param {string} arg_in_channel - input channel name.
	 * @param {string} arg_out_channel - output channel name.
	 * @param {function} arg_handler - payload tranform function. 
	 */
	channel_transform(arg_in_channel, arg_out_channel, arg_handler)
	{
		assert( T.isString(arg_in_channel), this.get_context() + ':channel_transform:bad input channel name')
		assert( T.isString(arg_out_channel), this.get_context() + ':channel_transform:bad output channel name')
		assert( T.isFunction(arg_handler), this.get_context() + ':channel_transform:bad transform function')
		const handler = (payload)=>{
			const xform_payload = arg_handler(payload)
			this.channel_send(arg_out_channel, xform_payload)
		}
		this.channel_on(arg_in_channel, handler)
	}
}