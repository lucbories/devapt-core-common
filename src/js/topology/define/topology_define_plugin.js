// NPM IMPORTS
import assert from 'assert'
import fs from 'fs'

// COMMON IMPORTS
import T from '../../utils/types'
import TopologyDefineItem from './topology_define_item'


let context = 'common/topology/define/topology_define_plugin'



/**
 * TopologyDefinePlugin class: describe a Plugin topology item.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
* SETTINGS FORMAT:
* 	"plugins":
* 		"pluginA":
*			"type":"...", // rendering, services
* 			"file":"..."
* 		"pluginB":
*			"type":"...",
* 			"package":"..."
* 
 */
export default class TopologyDefinePlugin extends TopologyDefineItem
{
	/**
	 * Create a TopologyDefinePlugin instance.
	 * 
	 * @param {string} arg_name - instance name.
	 * @param {object} arg_settings - instance settings map.
	 * @param {string} arg_log_context - trace context string.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_name, arg_settings, arg_log_context)
	{
		const log_context = arg_log_context ? arg_log_context : context
		super(arg_name, arg_settings, 'TopologyDefinePlugin', log_context)
		this.is_topology_define_plugin = true

		this.topology_type = 'plugins'
		
		this.topology_plugin_type = this.get_setting('type', undefined)
		this.topology_plugin_file = this.get_setting('file', undefined)
		this.topology_plugin_package = this.get_setting('package', undefined)

		this.info('Plugin is created')
	}



	/**
	 * Load rendering plugins.
	 * 
	 * @returns {Class} - Plugin class.
	 */
	load_plugin_class()
	{
		const self = this
		self.enter_group('load_plugin_class')

		this.debug('plugin=%s', this.get_name())

		let plugin_class = undefined

		// RENDERING PLUGIN IS LOADED FROM A NPM PACKAGE
		if ( T.isString(this.topology_plugin_package) && this.topology_plugin_package != 'default' )
		{
			// TODO : loading packages without full path?
			let file_path = undefined
			const pkg = this.topology_plugin_package

			file_path = self.get_runtime().context.get_absolute_path('./node_modules/', pkg)
			let file_path_stats = file_path ? fs.statSync(file_path) : undefined
			if ( ! file_path_stats || ! file_path_stats.isDirectory())
			{
				file_path = self.get_runtime().context.get_absolute_path('../node_modules/', pkg)
				file_path_stats = file_path ? fs.statSync(file_path) : undefined
				if ( ! file_path_stats || ! file_path_stats.isDirectory())
				{
					file_path = self.get_runtime().context.get_absolute_path('../../node_modules/', pkg)
					file_path_stats = file_path ? fs.statSync(file_path) : undefined
					if ( ! file_path_stats || ! file_path_stats.isDirectory())
					{
						file_path = self.get_runtime().context.get_absolute_path('../../../node_modules/', pkg)
						file_path_stats = file_path ? fs.statSync(file_path) : undefined
						if ( ! file_path_stats || ! file_path_stats.isDirectory())
						{
							file_path = undefined
						}
					}
				}
			}

			if (file_path)
			{
				console.log(context + ':load_plugin_class:package=%s for plugin=%s at=%s', pkg, this.get_name(), file_path)
				plugin_class = require(file_path)
			}
			else
			{
				file_path = undefined
				console.error(context + ':load_plugin_class:not found package=%s for plugin=%s at=%s', pkg, this.get_name())
			}
		}


		// LOAD A PLUGIN FROM A PATH
		else if ( T.isString(this.topology_plugin_file) )
		{
			const file_path = self.get_runtime().context.get_absolute_path(this.topology_plugin_file)
			console.log(context + ':load_plugin_class:file_path=%s for plugin=%s', file_path, this.get_name())

			plugin_class = require(file_path)
		}

		if (plugin_class && plugin_class.default)
		{
			plugin_class = plugin_class.default
		}

		self.leave_group('load_plugin_class')
		return plugin_class
	}



	/**
	 * Create plugins.
	 * 
	 * @param {RuntimeBase} - arg_runtime - Runtime instance.
	 * @param {Class} - arg_plugin_class - Plugin class.
	 * @param {PluginsManager} - arg_plugins_manager - PluginsManager instance.
	 * 
	 * @returns {Promise}
	 */
	create_plugin(arg_runtime, arg_plugin_class, arg_plugins_manager)
	{
		// REGISTER PLUGIN CLASS
		if (arg_plugin_class)
		{
			try
			{
				const plugin = new arg_plugin_class(arg_runtime, arg_plugins_manager)
				arg_plugins_manager.load_at_first(plugin)
				plugin.$plugin_class = arg_plugin_class

				this.topology_plugin_instance = plugin

				console.log(context + ':create_plugin:plugin=%s is loaded', this.get_name())
				return plugin
			}
			catch(e) {
				console.error(context + ':create_plugin:plugin=%s error during load [%s]', this.get_name(), e.toString())
			}
		}

		return undefined
	}



	/**
	 * Load rendering plugins.
	 * 
	 * @param {RuntimeBase} - arg_runtime - Runtime instance.
	 * 
	 * @returns {Promise} - Promise of Plugin instance.
	 */
	load_rendering_plugin(arg_runtime)
	{
		const self = this
		self.enter_group('load_rendering_plugin')

		assert( T.isObject(arg_runtime) && arg_runtime.is_base_runtime, context + ':load_rendering_plugin:bad runtime instance' )
		const plugins_mgr = arg_runtime.get_plugins_factory().get_rendering_manager()
		assert( T.isObject(plugins_mgr) && plugins_mgr.is_plugins_manager, context + ':load_rendering_plugin:bad plugin manager object')

		const plugin_class = this.load_plugin_class()
		const plugin = this.create_plugin(arg_runtime, plugin_class, plugins_mgr)
		
		plugin.find_rendering_function = (type)=>{
			if ( T.isFunction(plugin.$plugin_class.find_rendering_function) )
			{
				// console.log('plugin.$plugin_class.find_rendering_function FOUND')
				return plugin.$plugin_class.find_rendering_function(type)
			}
			// console.log('plugin.$plugin_class.find_rendering_function NOT FOUND')
			return undefined
		}
			
		self.leave_group('load_rendering_plugin')
		return Promise.resolve(plugin)
	}



	/**
	 * Load services plugins.
	 * 
	 * @param {RuntimeBase} - arg_runtime - Runtime instance.
	 * 
	 * @returns {Promise} - Promise of Plugin instance.
	 */
	load_services_plugin(arg_runtime)
	{
		const self = this
		self.enter_group('load_services_plugin')

		assert( T.isObject(arg_runtime) && arg_runtime.is_base_runtime, context + ':load_services_plugin:bad runtime instance' )
		const plugins_mgr = arg_runtime.get_plugins_factory().get_services_manager()
		assert( T.isObject(plugins_mgr) && plugins_mgr.is_plugins_manager, context + ':load_services_plugin:bad plugin manager object')

		const plugin_class = this.load_plugin_class()
		const plugin = this.create_plugin(arg_runtime, plugin_class, plugins_mgr)
		plugins_mgr.register_plugin(plugin)
			
		self.leave_group('load_services_plugin')
		return Promise.resolve(plugin)
	}



	/**
	 * Find a rendering function.
	 * 
	 * @param {string} arg_type - rendering item type.
	 * 
	 * @returns {Function} - rendering function.
	 */
	find_rendering_function(arg_type)
	{
		if ( this.topology_plugin_type != 'rendering')
		{
			console.warn(context + ':find_rendering_function:not a rendering plugin:' + this.get_name())
			return undefined
		}

		if ( ! T.isObject(this.topology_plugin_instance) || ! this.topology_plugin_instance.is_rendering_plugin )
		{
			console.warn(context + ':find_rendering_function:no rendering plugin instance:' + this.get_name())
			return undefined
		}

		if ( ! T.isFunction(this.topology_plugin_instance.find_rendering_function) )
		{
			console.warn(context + ':find_rendering_function:no rendering plugin function:' + this.get_name())
			return undefined
		}

		const fn = this.topology_plugin_instance.find_rendering_function(arg_type)
		// console.log(fn, context + ':find_rendering_function:rendering function for ' + this.get_name())

		return fn
	}
}
