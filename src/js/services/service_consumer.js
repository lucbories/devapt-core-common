// NPM IMPORTS

// COMMON IMPORTS
import ServiceConsumerByUrl from './service_consumer_by_url'


/**
 * Contextual constant for this file logs.
 * @private
 * @type {string}
 */
let context = 'common/services/service_consumer'



/**
 * Service consumer base class.
 * @abstract
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class ServiceConsumer extends ServiceConsumerByUrl
{
	/**
	 * Create a service by url consumer.
	 * 
	 * @param {string} arg_consumer_name - consumer name.
	 * @param {Service} arg_service_instance - service instance.
	 * @param {string} arg_context - logging context label.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_consumer_name, arg_service_instance, arg_context)
	{
		super(arg_consumer_name, arg_service_instance, arg_context ? arg_context : context)
	}
}
