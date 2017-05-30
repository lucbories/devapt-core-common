// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T from '../utils/types'


const context = 'common/base/distributed_message'



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
 * 		->get_sender():string - Get message sender.
 * 		->...
 */
export default class DistributedMessage
{
    /**
     * Create a DistributedMessage instance.
	 * 
	 * @param {string|object} arg_sender_name - sender name or message plain object (without other args).
	 * @param {string} arg_target_name - recipient name.
	 * @param {object} arg_payload - message payload plain object.
	 * @param {string} arg_channel - channel name.
	 * @param {array}  arg_buses_path - message buses path (optional default []).
	 * 
     * @returns {nothing}
     */
	constructor(arg_sender_name, arg_target_name, arg_payload, arg_channel='default', arg_buses_path=[])
	{
		// CASE WITH ONLY ONE ARGUMENT: MESSAGE PLAIN OBJECT
		if (arguments.length == 1)
		{
			const plain_msg = arguments[0]
			arg_sender_name = plain_msg._sender
			arg_target_name = plain_msg._target
			arg_payload     = plain_msg._payload
			arg_channel     = plain_msg._channel
			arg_buses_path  = plain_msg._buses_path
		}

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

		/**
		 * Message buses path.
		 * @type {array}
		 */
		this._buses_path = T.isArray(arg_buses_path) ? arg_buses_path : []
	}



	/**
	 * Add a step to message buses path.
	 * 
	 * @param {string} arg_bus_name - message step bus name.
	 * 
	 * @returns {nothing}
	 */
	add_buses_step(arg_bus_name)
	{
		this._buses_path.push(arg_bus_name)
	}



	/**
	 * Test if message has a step into buses path.
	 * 
	 * @param {string} arg_bus_name - message step bus name.
	 * 
	 * @returns {nothing}
	 */
	has_buses_step(arg_bus_name)
	{
		return this._buses_path.indexOf(arg_bus_name) > -1
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