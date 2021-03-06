// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T        from '../utils/types'
import Instance from '../base/instance'


let context = 'common/plugins/plugin'



/**
 * Plugins base class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class Plugin extends Instance
{
	/**
	 * Create a plugin instance.
	 * 
	 * @param {PluginsManager} arg_manager - plugins manager.
	 * @param {string} arg_name - plugin name.
	 * @param {string} arg_class - plugin class name.
	 * @param {object} arg_settings - plugin settings map.
	 * @param {string|undefined} arg_log_context - optional.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_runtime, arg_manager, arg_name, arg_class, arg_settings, arg_log_context)
	{
		const create_context = T.isString(arg_log_context) ? arg_log_context : context
		assert( T.isObject(arg_runtime) && arg_runtime.is_base_runtime, context + ':constructor:bad runtime instance' )
		assert( T.isObject(arg_manager) && arg_manager.is_plugins_manager, create_context + ':bad manager object for ' + arg_name + ' - ' + arg_log_context)
		assert( T.isString(arg_name), create_context + ':bad name string')
		assert( T.isString(arg_class.toString()), create_context + ':bad class string for ' + arg_name)
		assert( T.isObject(arg_settings), create_context + ':bad settings object for ' + arg_name)
		
		if (arg_settings.get)
		{
			const version = T.isString( arg_settings.get('version') ) ? arg_settings.get('version') : '0.0.0'
			arg_settings = arg_settings.set('version', version)
			arg_settings = arg_settings.set('runtime', arg_runtime)
			arg_settings = arg_settings.set('logger_manager', arg_runtime.get_logger_manager())
		} else {
			arg_settings.version = T.isString(arg_settings.version) ? arg_settings.version : '0.0.0'
			arg_settings.runtime = arg_runtime
			arg_settings.logger_manager = arg_runtime.get_logger_manager()
		}

		super('plugins', (arg_class ? arg_class.toString() : 'Plugin'), arg_name, arg_settings, arg_log_context)
		
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_plugin = true
		
		/**
		 * Plugin version.
		 * @type {string}
		 */
		this.$version = arg_settings.version

		/**
		 * Plugins manager.
		 * @type {PluginManager}
		 */
		this.manager = arg_manager

		/**
		 * Enabled flag.
		 * @type {boolean}
		 */
		this.is_enabled = false
	}



	/**
	 * Get plugin js asset files for browser loading.
	 * 
	 * @returns {string}
	 */
	get_browser_plugin_file_url()
	{
		return undefined
	}

	
	
	/**
	 * Enable a plugin.
	 * @abstract
	 * 
	 * @param {object|undefined} arg_context - optional contextual map.
	 * 
	 * @returns {object} - a promise object of a boolean result (success:true, failure:false).
	 */
	/* eslint no-unused-vars: "off" */
	enable(arg_context)
	{
		this.is_enabled = true
		this.manager.enabled_plugins.add(this)
		return Promise.resolve(true)
	}

	
	
	/**
	 * Disable a plugin.
	 * @abstract
	 * 
	 * @param {object|undefined} arg_context - optional contextual map.
	 * 
	 * @returns {object} - a promise object of a boolean result (success:true, failure:false).
	 */
	/* eslint no-unused-vars: "off" */
	disable(arg_context)
	{
		this.is_enabled = false
		this.manager.enabled_plugins.remove(this)
		return Promise.resolve(true)
	}

	
	
    /**
     * Get the plugin version.
	 * 
     * @returns {string} plugin version
     */
	get_version()
	{
		return this.$version
	}
}
