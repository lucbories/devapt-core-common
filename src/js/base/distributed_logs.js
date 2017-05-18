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
	 * @param {string} arg_sender_name - sender name.
	 * @param {string} arg_target_name - recipient name.
	 * @param {string} arg_timestamp - logs timestamp string.
	 * @param {string} arg_level - logs level string.
	 * @param {array}  arg_values - logs values array.
	 * @param {string} arg_channel - channel name.
	 * 
     * @returns {nothing}
     */
	constructor(arg_sender_name, arg_target_name, arg_timestamp, arg_level, arg_values, arg_channel='logs')
	{
		assert( T.isString(arg_timestamp) , context + ':bad log timestamp string')
		assert( T.isString(arg_level) , context + ':bad log level string')
		assert( T.isArray(arg_values), context + ':bad logs values array')

		super(arg_sender_name, arg_target_name, { ts:arg_timestamp, level:arg_level, source:'SERVER', logs:arg_values }, arg_channel)

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