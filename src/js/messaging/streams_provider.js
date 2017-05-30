// NPM IMPORTS
// import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import T               from '../utils/types'
import Instance        from '../base/instance'
import Stream          from '../messaging/stream'


const context = 'common/messaging/streams_provider'



/**
 * Service provider base class.
 * @abstract
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
 * 	API:
 * 		->add_stream(arg_stream_name, arg_stream=undefined):nothing - register a new stream.
 * 		->remove_stream(arg_stream_name):nothing - unregister a stream.
 * 		->get_stream(arg_stream_name):Stream - get a registered stream.
 * 		->subscribe(arg_stream_name, arg_subscriber)
 * 		->unsubscribe(arg_stream_name, arg_subscriber)
 * 
 */
export default class SteamsProvider extends Instance
{
	/**
	 * Create a streams provider.
	 * 
	 * @param {string} arg_collection - collection name.
	 * @param {string} arg_class - class name.
	 * @param {string} arg_name - instance name.
	 * @param {Immutable.Map|object} arg_settings - settings plain object
	 * @param {string} arg_log_context - log context.
	 * @param {LoggerManager} arg_logger_manager - logger manager object (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_collection, arg_class, arg_name, arg_settings, arg_log_context, arg_logger_manager)
	{
		super(arg_collection, arg_class, arg_name, arg_settings, arg_log_context, arg_logger_manager)
		
		this.is_streams_provider = true

		this._streams = {}
	}
	
	

	/**
	 * Register a new stream.
	 * 
	 * @param {string} arg_stream_name - stream name.
	 * @param {Stream} arg_stream - stream instance (optional, default undefined).
	 * 
	 * @returns {nothing}
	 */
	add_stream(arg_stream_name, arg_stream=undefined)
	{
		if (arg_stream_name in this._streams)
		{
			return
		}
		
		// INIT REGISTERING RECORD
		this._streams[arg_stream_name] = {
			subscribers:[],
			stream:undefined,
			own_stream:true,
			unsubscribe:undefined
		}

		// CREATE STREAM IF NEEDED
		if ( ! T.isObject(arg_stream) || ! arg_stream.is_stream )
		{
			arg_stream = new Stream()
			this._streams[arg_stream_name].own_stream = true
		}
		this._streams[arg_stream_name].stream = arg_stream

		// HANDLE POST
		const post_cb = (v) => {
			// console.log(context + ':on stream value for provider %s',  arg_provider_name)
			this.post_to_subscribers(arg_stream_name, v)
		}
		this._streams[arg_stream_name].unsubscribe = this._streams[arg_stream_name].stream.subscribe(post_cb)
	}
	
	

	/**
	 * Unregister a stream.
	 * 
	 * @param {string} arg_stream_name - stream name.
	 * 
	 * @returns {boolean}
	 */
	remove_stream(arg_stream_name)
	{
		if (arg_stream_name in this._streams)
		{
			const record = this._streams[arg_stream_name]

			record.unsubscribe()

			_.forEach(record.subscribers,
				(subscriber)=>{
					this.unsubscribe(arg_stream_name, subscriber)
				}
			)

			if (record.own_stream)
			{
				delete record.stream
			}

			delete this._streams[arg_stream_name]
			return true
		}
		return false
	}
	
	

	/**
	 * Get a stream.
	 * 
	 * @param {string} arg_stream_name - stream name.
	 * 
	 * @returns {Stream}
	 */
	get_stream(arg_stream_name)
	{
		if (arg_stream_name in this._streams)
		{
			const record = this._streams[arg_stream_name]
			return record.stream
		}
		return undefined
	}
	
	

	/**
	 * Test if a stream is registered.
	 * 
	 * @param {string} arg_stream_name - stream name.
	 * 
	 * @returns {boolean}
	 */
	has_stream(arg_stream_name)
	{
		return (arg_stream_name in this._streams)
	}
	
	
	
	/**
	 * Add a subscriber socket.
	 * 
	 * @param {string} arg_stream_name - stream name.
	 * @param {object} arg_subscriber  - subscriber object.
	 * 
	 * @returns {boolean}
	 */
	subscribe(arg_stream_name, arg_subscriber)
	{
		if (arg_stream_name in this._streams)
		{
			const record = this._streams[arg_stream_name]
			record.subscribers.push(arg_subscriber)
			return true
		}

		return false
	}
	
	
	
	/**
	 * Remove a subscriber socket.
	 * 
	 * @param {string} arg_stream_name - stream name.
	 * @param {object} arg_subscriber  - subscriber object.
	 * @param {function} arg_subscriber_equal_fn - test function (default is (a,b)=>(a==b) ).
	 * 
	 * @returns {nothing}
	 */
	unsubscribe(arg_stream_name, arg_subscriber, arg_subscriber_equal_fn=(a,b)=>a==b)
	{
		if (arg_stream_name in this._streams)
		{
			const record = this._streams[arg_stream_name]
			
			_.remove(record.subscribers,
				(subscriber)=>{
					return arg_subscriber_equal_fn(subscriber, arg_subscriber)
				}
			)

			return true
		}

		return false
	}
	
	
	
	/**
	 * Post streams values to subscribers.
	 * 
	 * @param {string} arg_stream_name - stream name.
	 * @param {object} arg_datas - response values.
	 * 
	 * @returns {nothing}
	 */
	post_to_subscribers(arg_stream_name, arg_datas)
	{
		if (arg_stream_name in this._streams)
		{
			const record = this._streams[arg_stream_name]
			
			_.forEach(record.subscribers,
				(subscriber) => {
					this.post_to_subscriber(subscriber, arg_stream_name, arg_datas)
				}
			)
		}
	}
	
	
	
	/**
	 * Post streams values to one subscriber.
	 * @abstract
	 * 
	 * @param {object} arg_subscriber - subscriber object.
	 * @param {string} arg_stream_name - stream name.
	 * @param {object} arg_datas - response values.
	 * 
	 * @returns {nothing}
	 */
	post_to_subscriber(arg_subscriber, arg_stream_name, arg_datas)
	{
		console.log(context + ':post_to_subscriber:stream=[%s] subscriber=', arg_stream_name, arg_subscriber)
		console.log(context + ':post_to_subscriber:stream=[%s] datas=', arg_stream_name, arg_datas)
	}
}
