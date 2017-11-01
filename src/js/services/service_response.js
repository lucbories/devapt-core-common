// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T              from '../utils/types'
import Introspectable from '../base/introspectable'


/**
 * Contextual constant for this file logs.
 * @private
 * @type {string}
 */
const context = 'common/services/service_response'


/**
 * Request properties array.
 * @private
 * @type {array}
 */
const properties = [
	{
		name:'service',
		type:'string',
		current:undefined,
		private:true,
		setter:true,
		getter:true,
		tester:true
	},
	{
		name:'operation',
		type:'string',
		current:undefined,
		private:true,
		setter:true,
		getter:true,
		tester:true
	},
	{
		name:'results',
		type:'array',
		current:undefined,
		private:true,
		setter:true,
		getter:true,
		tester:true
	},
	{
		name:'socket_id',
		type:'string',
		current:undefined,
		private:true,
		serializable:true,
		setter:true,
		getter:true,
		tester:true
	},
	// {
	// 	name:'session_uid',
	// 	type:'string',
	// 	current:undefined,
	// 	private:true,
	// 	serializable:true,
	// 	setter:true,
	// 	getter:true,
	// 	tester:true
	// },
	{
		name:'has_error',
		type:'boolean',
		current:false,
		private:true,
		setter:true,
		getter:true,
		tester:true
	},
	{
		name:'error',
		type:'string',
		current:undefined,
		private:true,
		setter:true,
		getter:true,
		tester:true
	}
]


/**
 * Response methods array.
 * @private
 * @type {array}
 */
const methods =[]


/**
 * Service response class.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class ServiceResponse extends Introspectable
{
    /**
     * Create a Service response instance.
	 * 
	 * @param {object} arg_values - values object.
	 * 
	 * @returns {nothing}
     */
	constructor(arg_values)
	{
		assert( T.isObject(arg_values), context + ':constructor:bad values object')

		if ( arg_values.is_service_request && T.isFunction(arg_values.get_service) )
		{
			arg_values = {
				service:arg_values.get_service(),
				operation:arg_values.get_operation(),
				socket_id:arg_values.get_socket_id()
			}
		}

		super(properties, methods, arg_values)

		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_service_response = true
	}
}
