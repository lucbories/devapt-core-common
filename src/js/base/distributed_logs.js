// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T from '../utils/types'
import DistributedMessage from './distributed_message'


const context = 'common/base/distributed_logs'



/**
 * DistributedLogs class for distributed communication.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class DistributedLogs extends DistributedMessage
{
    /**
     * Create a DistributedLogs instance.
	 * 
	 * @param {string|object} arg_sender_name - sender name or message plain object (without other args).
	 * @param {string} arg_target_name - recipient name.
	 * @param {string} arg_timestamp - logs timestamp string.
	 * @param {string} arg_level - logs level string.
	 * @param {array}  arg_values - logs values array.
	 * @param {string} arg_channel - channel name.
	 * @param {array}  arg_buses_path - message buses path (optional default []).
	 * 
     * @returns {nothing}
     */
	constructor(arg_sender_name, arg_target_name, arg_timestamp, arg_level, arg_values, arg_channel='logs', arg_buses_path=[])
	{
		// CASE WITH ONLY ONE ARGUMENT: MESSAGE PLAIN OBJECT
		if (arguments.length == 1)
		{
			const plain_msg = arguments[0]
			arg_sender_name = plain_msg._sender
			arg_target_name = plain_msg._target
			arg_timestamp   = plain_msg._payload.ts
			arg_level       = plain_msg._payload.level
			arg_values      = plain_msg._payload.logs
			arg_channel     = plain_msg._channel
			arg_buses_path  = plain_msg._buses_path
		}

		assert( T.isString(arg_timestamp) , context + ':bad log timestamp string')
		assert( T.isString(arg_level) , context + ':bad log level string')
		assert( T.isArray(arg_values), context + ':bad logs values array')

		const payload = { ts:arg_timestamp, level:arg_level, source:'SERVER', logs:arg_values }

		super(arg_sender_name, arg_target_name, payload, arg_channel, arg_buses_path)

		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_distributed_logs = true

		this.set_channel(arg_channel)
	}
    
    

	/**
	 * Get logs timestamp.
	 * 
	 * @returns {string} - logs timestamp.
	 */
	get_logs_ts()
	{
		return this._payload.ts
	}
    
    

	/**
	 * Get logs level.
	 * 
	 * @returns {string} - logs level.
	 */
	get_logs_level()
	{
		return this._payload.level
	}
    
    

	/**
	 * Get logs source.
	 * 
	 * @returns {string} - logs source.
	 */
	get_logs_source()
	{
		return this._payload.source
	}
    
    

	/**
	 * Get logs values.
	 * 
	 * @returns {array} - logs values array.
	 */
	get_logs_values()
	{
		return this._payload.logs
	}
	
	
	
	/**
	 * Check message format.
	 * 
	 * @returns {boolean} - true:good format, false:bad format.
	 */
	check_msg_format()
	{
		if ( ! super.check_msg_format() )
		{
			return false
		}

		if ( T.isString(this.this._payload.ts) && this.this._payload.ts.length > 0 && T.isString(this.this._payload.level) && this.this._payload.level.length > 0 && T.isArray(this._payload.logs) )
		{
			return true
		}

		return false
	}
}