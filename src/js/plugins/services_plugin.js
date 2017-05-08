// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T              from '../utils/types'
import FeaturesPlugin from './features_plugin'


const context = 'common/plugins/services_plugin'



/**
 * Plugin class for services plugin.
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class ServicesPlugin extends FeaturesPlugin
{
    /**
     * Create a ServicesPlugin instance.
	 * @extends Instance
	 * 
	 * @param {RuntimeBase} arg_runtime - runtime instance.
	 * @param {PluginsManager} arg_manager - plugins manager
	 * @param {string} arg_name - plugin name
	 * @param {string} arg_version - plugin version.
	 * 
	 * @returns {nothing}
     */
	constructor(arg_runtime, arg_manager, arg_name, arg_version)
	{
		assert( T.isObject(arg_runtime) && arg_runtime.is_base_runtime, context + ':constructor:bad runtime instance' )
		assert( T.isObject(arg_manager), context + ':constructor:bad plugins manager instance' )

		super(arg_runtime, arg_manager, arg_name, 'ServicesPlugin', { version: arg_version }, context)
		
		this.is_services_plugin = true
	}
}
