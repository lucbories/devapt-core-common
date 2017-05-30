// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T        from '../utils/types'
import BusEngine from './bus_engine'
import Stream   from './stream'


const context = 'common/messaging/stream_bus_engine'



/**
 * Stream based bus engine class for message bus client or server.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
* API:
*   ->constructor(arg_name,arg_settings,arg_log_context,arg_logger_manager).
* 
*	->channel_list():array                           - List engine channels.
*   ->channel_add(arg_channel):nothing               - Add a channel.
*   ->channel_send(arg_channel, arg_payload):nothing - Send a message into a channel.
*   ->channel_on(arg_channel, arg_handler):nothing   - Subscribe on channel inputs.
*   ->channel_transform(arg_in_channel, arg_out_channel, arg_xform_handler):nothing - Transform payload of input channel to output channel.
* 
 */
export default class StreamBusEngine extends BusEngine
{
	/**
	 * Create a bus.
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
		// this._channels['default'] = new Stream()
		// this.channel_add('default')
	}
	

	
	/**
	 * List engine channels.
	 * 
	 * @returns {array}
	 */
	channel_list()
	{
		return Object.keys(this._channels)
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
	 * @param {object} arg_payload - payload data object.
	 * 
	 * @returns {nothing}
	 */
	channel_send(arg_channel, arg_payload)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_send:bad channel name')
		assert( arg_payload, this.get_context() + ':channel_send:bad payload data')
		assert( arg_channel in this._channels, this.get_context() + ':channel_send:channel [' + arg_channel + '] stream not found')
		this._channels[arg_channel].push(arg_payload)
	}
	
	
	
	/**
	 * Subscribe on channel inputs.
	 * 
	 * @param {string} arg_channel - channel name string.
	 * @param {function} arg_handler - f(payload):nothing
	 * @param {function} arg_predicate - p(payload):boolean
	 * 
	 * @returns {nothing}
	 */
	channel_on(arg_channel, arg_handler, arg_predicate=undefined)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_on:bad channel name on engine [' + this.get_name() + ']')
		assert( T.isFunction(arg_handler), this.get_context() + ':channel_on:bad handler function on engine [' + this.get_name() + '] for channel [' + arg_channel + ']')
		assert( arg_channel in this._channels, this.get_context() + ':channel_on:channel [' + arg_channel + '] stream not found on engine [' + this.get_name() + ']')
		this._channels[arg_channel].subscribe(
			(value) => {
				// console.log(context + ':subscribe:bus[' + this.get_name() + '] channel [' + arg_channel + '] received value', value)
				
				// FILTER BY PREDICATE
				if ( T.isFunction(arg_predicate) )
				{
					if ( arg_predicate(value) )
					{
						arg_handler(value)
						return
					}
				}
				
				// NO VALID PREDICATE
				arg_handler(value)
			}
		)
	}
}