// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T from '../utils/types'
import DistributedMessage from './distributed_message'


/**
 * Contextual constant for this file logs.
 * @private
 */
const context = 'common/base/distributed_metrics'



/**
 * DistributedMetrics class for distributed communication.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class DistributedMetrics extends DistributedMessage
{
    /**
     * Create a DistributedMetrics instance.
	 * 
	 * @param {string|object} arg_sender_name - sender name or message plain object (without other args).
	 * @param {string} arg_target_name - recipient name.
	 * @param {string} arg_type - metrics type string.
	 * @param {array} arg_values - metrics values array.
	 * @param {string} arg_channel - channel name.
	 * @param {array}  arg_buses_path - message buses path (optional default []).
	 * 
     * @returns {nothing}
     */
	constructor(arg_sender_name, arg_target_name, arg_type, arg_values, arg_channel='metrics', arg_buses_path=[])
	{
		// CASE WITH ONLY ONE ARGUMENT: MESSAGE PLAIN OBJECT
		if (arguments.length == 1)
		{
			const plain_msg = arguments[0]
			arg_sender_name = plain_msg._sender
			arg_target_name = plain_msg._target
			arg_type        = plain_msg._payload.metric
			arg_values      = plain_msg._payload.metrics
			arg_channel     = plain_msg._channel
			arg_buses_path  = plain_msg._buses_path
		}

		assert( T.isString(arg_type) , context + ':bad metric type string')
		assert( T.isArray(arg_values), context + ':bad metrics values array')

		const payload = { metric:arg_type, metrics:arg_values }
		
		super(arg_sender_name, arg_target_name, payload, arg_channel, arg_buses_path)

		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_distributed_metrics = true

		this.set_channel(arg_channel)
	}
    
    

	/**
	 * Get metric type.
	 * 
	 * @returns {string} - metric type.
	 */
	get_metrics_type()
	{
		return this._payload.metric
	}
    
    

	/**
	 * Get metrics values.
	 * 
	 * @returns {array} - metrics values array.
	 */
	get_metrics_values()
	{
		return this._payload.metrics
	}
	
	
	
	/**
	 * Check message format.
	 * 
	 * @returns {boolean} - true:good format, false:bad format.
	 */
	check_msg_format()
	{
		// console.log(context + ':check_msg_format:this', this)

		if ( ! super.check_msg_format() )
		{
			return false
		}

		// console.log(context + ':check_msg_format:this._payload.metric=%s, this._payload.metrics=%s', this._payload.metric, this._payload.metrics)
		if ( T.isString(this._payload.metric) && this._payload.metric.length > 0 && T.isArray(this._payload.metrics) )
		{
			return true
		}

		return false
	}
}