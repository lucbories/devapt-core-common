// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T from '../utils/types'
import DistributedMessage from './distributed_message'


let context = 'common/base/distributed_metrics'



/**
 * @file DistributedMetrics class for distributed communication.
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class DistributedMetrics extends DistributedMessage
{
    /**
     * Create a DistributedMetrics instance.
	 * 
	 * @param {string} arg_sender_name - sender name.
	 * @param {string} arg_target_name - recipient name.
	 * @param {string} arg_type - metrics type string.
	 * @param {array} arg_values - metrics values array.
	 * 
     * @returns {nothing}
     */
	constructor(arg_sender_name, arg_target_name, arg_type, arg_values)
	{
		assert( T.isString(arg_type) , context + ':bad metric type string')
		assert( T.isArray(arg_values), context + ':bad metrics values array')

		super(arg_sender_name, arg_target_name, { metric:arg_type, metrics:arg_values })

		this.is_distributed_metrics = true

		this.set_channel('metrics')
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