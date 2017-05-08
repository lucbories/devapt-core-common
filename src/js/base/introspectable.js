
// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T from '../utils/types'


let context = 'common/base/introspectable'



/**
 * @file Base class to build easily classes.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class Introspectable
{
	/**
	 * Create an Introspectable instance.
	 * @abstract
	 * 
	 * 	Property record format:
	 * 		{
	 *			name:string,
	 *			type:string,
	 *			value:any,
	 *			private:boolean,
	 *			getter:boolean,
	 * 			setter:boolean,
	 *			tester:boolean
	 * 		}
	 * 	API:
	 * 		->has_property(arg_name):boolean - test if instance has given named property.
	 * 		->add_property(arg_record:object):boolean - add given named property.
	 * 		
	 * 		->set_property_value(arg_name, arg_value)
	 * 		->set_properties_values(arg_values:object|array):boolean - set properties values with arg_values as { prop_name_1:value1, ... }
	 * 		
	 * 		->has_method(arg_name):boolean - test if instance has given named method.
	 * 		->add_method(arg_record:object):boolean - add given named method.
	 * 
	 * @param {object} arg_properties - properties records as { name:'...', type:'', getter:true, setter: true, tester:true }.
	 * @param {object} arg_methods - methods records as { name:'...', type:'', functor:(...)=>{} }
	 * @param {object|undefined} arg_values - properties values (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_properties=[], arg_methods=[], arg_values=undefined)
	{
		this.is_introspectable = true
		
		this._properties = {}
		this._properties_names = []
		this._methods = {}
		this._methods_names = []

		// REGISTER PROPERTIES
		arg_properties.forEach(
			(prop_record)=>{
				this.add_property(prop_record)
			}
		)

		// REGISTER METHODS
		// arg_methods.forEach(
		// 	(method_record)=>{
				// this.add_method(method_record) // TODO
		// 	}
		// )

		// SET VALUES
		this.set_properties_values(arg_values)
	}



	/**
	 * Test if instance has given named property.
	 * 
	 * @param {string} arg_name - property name.
	 * 
	 * @returns {boolean}
	 */
	has_property(arg_name)
	{
		return (arg_name in this._properties) && ('current' in this[arg_name])
	}


	
	/**
	 * Test if instance has given named property.
	 * 
	 * @param {object} arg_record - property record.
	 * 
	 * @returns {boolean}
	 */
	add_property(arg_record)
	{
		assert( T.isObject(arg_record), context + ':add_property:bad property record object')

		const name     = T.isString(arg_record.name) ? arg_record.name.toLocaleLowerCase() : undefined
		const type     = T.isString(arg_record.type) ? arg_record.type.toLocaleLowerCase() : 'string'
		const value    = arg_record.value
		const is_priv  = T.isBoolean(arg_record.private) ? arg_record.private : true
		const getter   = T.isBoolean(arg_record.getter) ? arg_record.getter : true
		const setter   = T.isBoolean(arg_record.setter) ? arg_record.setter : true
		const tester   = T.isBoolean(arg_record.tester) ? arg_record.tester : true
		
		assert( T.isString(arg_record.name), context + ':add_property:bad property record.name string')

		const this_name = is_priv ? '_' + name : name
		assert( !(name in this) && !(this_name in this), context + ':add_property:property already exists')
		
		this._properties_names.push(name)
		this._properties[name] = {
			name:name,
			this_name:this_name,
			type:type,
			value:value,
			private:is_priv,
			getter:getter,
			setter:setter,
			tester:tester
		}

		// BUILD ATTRIBUTE
		this[this_name] = value

		// BUILD GETTER
		if (getter)
		{
			this['get_' + name] = ()=>{
				return this[this_name]
			}
		}
		
		// BUILD SETTER
		if (setter)
		{
			this['set_' + name] = (arg_value)=>{
				this.set_property_value(name, arg_value, this_name)
			}
		}
		
		// BUILD TESTER
		if (tester)
		{
			this['has_' + name] = ()=>{
				return this[this_name] ? true : false
			}
		}

		return true
	}



	/**
	 * Set a property value.
	 * 
	 * @param {string} arg_name - property name.
	 * @param {any}    arg_value - property value.
	 * @param {string} arg_this_name - property attribute name.
	 * 
	 * @returns {boolean}
	 */
	set_property_value(arg_name, arg_value, arg_this_name)
	{
		const attr_name = arg_this_name ? arg_this_name : arg_name
		this[attr_name] = arg_value
	}



	/**
	 * Get a property value.
	 * 
	 * @param {string} arg_name - property name.
	 * 
	 * @returns {any} - property value.
	 */
	get_property_value(arg_name)
	{
		if (! (arg_name in this._properties) )
		{
			return undefined
		}

		const property_record = this._properties[arg_name]
		const attr_name = property_record.this_name
		return this[attr_name]
	}



	/**
	 * Set properties values.
	 * 
	 * @param {object|array} arg_values - properties values.
	 * 
	 * @return {boolean}
	 */
	set_properties_values(arg_values)
	{
		if ( T.isArray(arg_values) || T.isArguments(arg_values) )
		{
			this._properties_names.forEach(
				(name, index)=>{
					const record = this._properties[name]
					const this_name = record.this_name
					const value = arg_values.length > index ? arg_values[index] : record.value
					this.set_property_value(name, value, this_name)
				}
			)

			return true
		}

		if ( T.isObject(arg_values) )
		{
			this._properties_names.forEach(
				(name)=>{
					const record = this._properties[name]
					const this_name = record.this_name
					const value = (name in arg_values) ? arg_values[name] : record.value
					this.set_property_value(name, value, this_name)
				}
			)

			return true
		}

		return false
	}



	/**
	 * Get properties values.
	 * 
	 * @return {object} - properties values.
	 */
	get_properties_values()
	{
		const values ={}
		this._properties_names.forEach(
			(name)=>{
				values[name] = this.get_property_value(name)
			}
		)
		return values
	}



	/**
	 * Test if instance has given named method.
	 * 
	 * @param {string} arg_name - method name.
	 * 
	 * @returns {boolean}
	 */
	has_method(arg_name)
	{
		return (arg_name in this._methods) && (arg_name in this) && T.isFunction(this[arg_name])
	}
}
