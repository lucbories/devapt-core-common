// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T from '../utils/types'


let context = 'common/base/distributed_message'



/**
 * DistributedMessage class for distributed communication.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
* 	API:
* 		->get_channel():string - get bus channel name.
* 		->set_channel(arg_channel):nothing - set bus channel name.
 */
export default class DistributedMessage
{
    /**
     * Create a DistributedMessage instance.
	 * 
	 * @param {string} arg_sender_name - sender name.
	 * @param {string} arg_target_name - recipient name.
	 * @param {object} arg_payload - message payload plain object.
	 * @param {string} arg_channel - channel name.
	 * 
     * @returns {nothing}
     */
	constructor(arg_sender_name, arg_target_name, arg_payload, arg_channel='default')
	{
		assert( T.isString(arg_sender_name) , context + ':bad sender string')
		assert( T.isString(arg_target_name) , context + ':bad target string')
		assert( T.isObject(arg_payload), context + ':bad payload object')

		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_distributed_message = true

		/**
		 * Message sender name.
		 * @type {string}
		 */
		this._sender = arg_sender_name

		/**
		 * Message target name.
		 * @type {string}
		 */
		this._target = arg_target_name

		/**
		 * Message payload object.
		 * @type {object}
		 */
		this._payload = arg_payload

		/**
		 * Message channel name.
		 * @type {string}
		 */
		this._channel = arg_channel
	}



	/**
	 * Get bus channel name.
	 * 
	 * @returns {string}
	 */
	get_channel()
	{
		return this._channel
	}



	/**
	 * Set bus channel name.
	 * 
	 * @param {string} arg_channel - bus channel name.
	 * 
	 * @returns {nothing}
	 */
	set_channel(arg_channel)
	{
		this._channel = arg_channel
	}
    
    

	/**
	 * Get message sender.
	 * 
	 * @returns {string} - sender name.
	 */
	get_sender()
	{
		return this._sender
	}
    
    

	/**
	 * Get message sender.
	 * 
	 * @returns {string} - target name.
	 */
	get_target()
	{
		return this._target
	}
    
    

	/**
	 * Get message sender.
	 * 
	 * @returns {object} - payload object
	 */
	get_payload()
	{
		return this._payload
	}
	
	
	
	/**
	 * Check message format.
	 * 
	 * @returns {boolean} - true:good format, false:bad format.
	 */
	check_msg_format()
	{
		// console.log(context + ':check_msg_format:this', this)

		if ( T.isString(this._sender) && this._sender.length > 0 && T.isString(this._target) && this._target.length > 0 && T.isObject(this._payload) )
		{
			return true
		}
		return false
	}
}