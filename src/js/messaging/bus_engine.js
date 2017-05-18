// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T        from '../utils/types'
import Instance from '../base/instance'


let context = 'common/messaging/bus_engine'



/**
 * Interface for bus engine.
 * @abstract
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
* API:
*   ->constructor(arg_name, arg_settings, arg_log_context).
* 
*   ->channel_list()
*   ->channel_add(arg_channel)
*   ->channel_send(arg_channel, arg_payload)
*   ->channel_on(arg_channel, arg_handler)
*   ->channel_transform(arg_in_channel, arg_out_channel, arg_xform_handler).
* 
 */
export default class BusEngine extends Instance
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
		super('buses', 'BusEngine', arg_name, arg_settings, arg_log_context, arg_logger_manager)
		
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_bus_engine = true
	}
	

	
	/**
	 * List engine channels.
	 * 
	 * @returns {array}
	 */
	channel_list()
	{
		throw new Error('channel_list:Not yet implemented')
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
		throw new Error('channel_add:Not yet implemented')
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
		throw new Error('channel_send:Not yet implemented')
	}
	
	
	
	/**
	 * Subscribe on channel inputs.
	 * 
	 * @param {string} arg_channel - channel name string.
	 * @param {function} arg_handler - f(payload):nothing.
	 * @param {function} arg_predicate - p(payload):boolean (optional).
	 * 
	 * @returns {function} - unsubscribe function.
	 */
	/* eslint no-unused-vars: "off" */
	channel_on(arg_channel, arg_handler, arg_predicate=undefined)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_on:bad channel name')
		assert( T.isFunction(arg_handler), this.get_context() + ':channel_on:bad handler function')
		throw new Error('channel_on:Not yet implemented')
	}



	/**
	 * Transform payload of input channel to output channel.
	 * 
	 * @param {string} arg_in_channel - input channel name.
	 * @param {string} arg_out_channel - output channel name.
	 * @param {function} arg_handler - payload tranform function.
	 * 
	 * @returns {nothing}
	 */
	channel_transform(arg_in_channel, arg_out_channel, arg_handler)
	{
		assert( T.isString(arg_in_channel), this.get_context() + ':channel_transform:bad input channel name')
		assert( T.isString(arg_out_channel), this.get_context() + ':channel_transform:bad output channel name')
		assert( T.isFunction(arg_handler), this.get_context() + ':channel_transform:bad transform function')
		throw new Error('channel_transform:Not yet implemented')
	}
}