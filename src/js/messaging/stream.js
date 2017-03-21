// NPM IMPORTS
import assert from 'assert'
import Baconjs from 'baconjs'
// import sizeof from 'object-sizeof'

// COMMON IMPORTS
import T from '../utils/types'

let context = 'common/messaging/stream'



/**
 * @file Stream class for BaconJS stream wrapping.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class Stream
{
	/**
	 * Create a stream.
	 * @returns {nothing}
	 */
	constructor(arg_stream=undefined)
	{
		this.is_stream = true

		this._source_stream = arg_stream ? arg_stream : new Baconjs.Bus()
		this._transformed_stream = this._source_stream
		
		this.counters = {}
		this.counters.msg_count = 0
		this.counters.msg_size = 0
		this.counters.errors_count = 0
		this.counters.subscribers_count = 0
		
		this._source_stream.onError(
			() => {
				this.counters.errors_count += 1
			}
		)
	}



	/**
	 * Get input stream.
	 * 
	 * @returns {Baconjs.Bus}
	 */
	get_source_stream()
	{
		return this._source_stream
	}



	/**
	 * Create a Stream instance with a DOM event source stream.
	 * 
	 * @param {string} arg_dom_elem - DOM element.
	 * @param {string} arg_event_name - DOM event name.
	 * 
	 * @returns {Stream}
	 */
	static from_dom_event(arg_dom_elem, arg_event_name)
	{
		return new Stream( Baconjs.fromEvent(arg_dom_elem, arg_event_name) )
	}



	/**
	 * Get output stream.
	 * 
	 * @returns {Baconjs.Bus}
	 */
	get_transformed_stream()
	{
		return this._transformed_stream
	}



	/**
	 * Set output stream.
	 * 
	 * @param {Baconjs.Bus} arg_stream - transformed stream.
	 * 
	 * @returns {Stream} - this
	 */
	set_transformed_stream(arg_stream)
	{
		this._transformed_stream = arg_stream
		return this
	}



	/**
	 * Set output stream transformation.
	 * 
	 * @param {function} arg_stream_transformation - function (source stream)=>{ return transformed stream }.
	 * 
	 * @returns {Stream} - this
	 */
	set_transformation(arg_stream_transformation)
	{
		assert( T.isFunction(arg_stream_transformation), context + ':transform:bad function')
		const src = this._source_stream
		const tr = this._transformed_stream

		try {
			this._transformed_stream = arg_stream_transformation(src)
		} catch(e) {
			this._transformed_stream = tr
			console.error(context + ':set_transformation', e)
		}
		
		return this
	}
	
	
	
	/**
	 * Get counters snapshot.
	 * 
	 * @returns {object} - counters.
	 */
	get_counters_snapshot()
	{
		const counters = Object.assign({}, this.counters)
		
		return counters
	}
	
	
	
	/**
	 * Get counters snapshot and reset values to 0.
	 */
	get_and_reset_counters_snapshot()
	{
		const counters = Object.assign({}, this.counters)
		
		this.counters.msg_count = 0
		this.counters.msg_size = 0
		this.counters.errors_count = 0
		this.counters.subscribers_count = 0
		
		return counters
	}
	
	
	
	/**
	 * Push a value into the stream.
	 * 
	 * @param {any}
	 * 
	 * @returns {Stream} - this.
	 */
	push(arg_value)
	{
		this.counters.msg_count += 1
		// this.counters.msg_size += sizeof(arg_value)// TODO circular error
		
		// console.log(arg_value,  context + ':push:value')
		this._source_stream.push(arg_value)
		return this
	}
	
	
	
	/**
	 * Subscribe to stream values.
	 * 
	 * @param {Function} arg_handler - value handler f(value) => nothing.
	 * 
	 * @returns {Function} - unsubscribe function
	 */
	subscribe(arg_handler)
	{
		assert( T.isFunction(arg_handler), context + ':subscribe:bad handler function')
		
		this.counters.subscribers_count += 1
		
		const unsubscribe = this._transformed_stream.onValue(arg_handler)
		return  () => {
			this.counters.subscribers_count -= 1
			unsubscribe()
		}
		
		// return this._transformed_stream.onValue(
		// 	(value) => {
		// 		console.log(value,  context + ':subscribe:value')
		// 	}
		// )
	}
}