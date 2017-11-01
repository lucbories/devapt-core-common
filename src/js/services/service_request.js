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
const context = 'common/services/service_request'


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
		serializable:true,
		setter:true,
		getter:true,
		tester:true
	},
	{
		name:'operation',
		type:'string',
		current:undefined,
		private:true,
		serializable:true,
		setter:true,
		getter:true,
		tester:true
	},
	{
		name:'operands',
		type:'array',
		current:[],
		private:true,
		serializable:true,
		setter:true,
		getter:true,
		tester:true
	},
	{
		name:'credentials',
		type:'object',
		current:undefined,
		private:true,
		serializable:true,
		setter:true,
		getter:true,
		tester:true
	},
	{
		name:'socket',
		type:'object',
		current:undefined,
		private:true,
		serializable:false,
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
	{
		name:'session_uid',
		type:'string',
		current:undefined,
		private:true,
		serializable:true,
		setter:true,
		getter:true,
		tester:true
	}
]


/**
 * Request methods array.
 * @private
 * @type {array}
 */
const methods =[]


/**
 * Service request class.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class ServiceRequest extends Introspectable
{
    /**
     * Create a Service request instance.
	 * 
	 * @param {object} arg_values - values object.
	 * 
	 * @returns {nothing}
     */
	constructor(arg_values)
	{
		assert( T.isObject(arg_values), context + ':constructor:bad values object')

		super(properties, methods, arg_values)

		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_service_request = true
	}



	/**
	 * Get operand by index.
	 * 
	 * @param {integer} arg_index - operand array index.
	 * 
	 * @returns {any}
	 */
	get_operand(arg_index)
	{
		const operands = this.get_operands()
		return arg_index >= 0 && arg_index < operands.length ? operands[arg_index] : undefined
	}
}
