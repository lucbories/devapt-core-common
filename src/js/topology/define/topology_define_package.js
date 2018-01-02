// NPM IMPORTS
// import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import TopologyDefineItem from './topology_define_item'
import TopologyDefineDatasource from './topology_define_datasource'
import TopologyDefineModel from './topology_define_model'
import TopologyDefineView from './topology_define_view'
import TopologyDefineMenu from './topology_define_menu'
import TopologyDefineMenubar from './topology_define_menubar'
import TopologyDefineService from './topology_define_service'
import TopologyDefineFeature from './topology_define_feature'
import TopologyDefineCommand from './topology_define_command'


const context = 'common/topology/define/topology_define_package'



/**
 * @file TopologyDefinePackage resource class.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class TopologyDefinePackage extends TopologyDefineItem
{
	/**
	 * Create a package resource instance.
	 * @class TopologyDefinePackage
	 * @extends TopologyDefineItem
	 * 
	 * SETTINGS FORMAT:
	 * 	"packages":
	 * 		"packageA":
	 *			"services":"...",
	 * 			"datasources":"...",
	 * 			"models":"...",
	 * 			"views":"...",
	 * 			"menus":"...",
	 * 			"menubars":"..."
	 * 		"packageB":...
	 * 
	 * @param {string} arg_name - instance name.
	 * @param {object} arg_settings - instance settings map.
	 * @param {string} arg_log_context - trace context string.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_name, arg_settings, arg_log_context)
	{
		// console.log('TopologyDefinePackage.arg_settings', arg_settings.toJS ? arg_settings.toJS() : arg_settings)

		const log_context = arg_log_context ? arg_log_context : context
		super(arg_name, arg_settings, 'TopologyDefinePackage', log_context)
		
		this.is_topology_define_package = true

		this.topology_type = 'packages'

		this.declare_collection('commands',    'command',     TopologyDefineCommand)
		this.declare_collection('services',    'service',     TopologyDefineService)
		this.declare_collection('features',    'feature',     TopologyDefineFeature)
		this.declare_collection('datasources', 'datasource',  TopologyDefineDatasource)
		this.declare_collection('models',      'model',       TopologyDefineModel)
		this.declare_collection('views',       'view',        TopologyDefineView)
		this.declare_collection('menus',       'menu',        TopologyDefineMenu)
		this.declare_collection('menubars',    'menubar',     TopologyDefineMenubar)
		
		this.info('Package is created')
	}



	/**
	 * Find a resource.
	 * 
	 * @param {string} arg_name - resource name (mandatory).
	 * @param {string} arg_type - resource type name (optional).
	 * 
	 * @returns {TopologyDefineItem|undefined} - resource instance.
	 */
	find_resource(arg_name, arg_type=undefined)
	{
		// console.log('package.find_resource ' + arg_name + ' in package ' + this.get_name() + ' for type ' + arg_type)

		if (arg_type)
		{
			let result = undefined
			switch(arg_type) {
				case 'command':
				case 'commands':    return this.command(arg_name)

				case 'service':
				case 'services':    return this.service(arg_name)

				case 'feature':
				case 'features':    return this.feature(arg_name)

				case 'datasource':
				case 'datasources': return this.datasource(arg_name)

				case 'model':
				case 'models':      return this.model(arg_name)
				
				case 'view':
				case 'views':       result = this.view(arg_name)
					if (!result)
					{
						console.log('package.find_resource ' + arg_name + ' NOT FOUND')
					}
					return result

				case 'menu':
				case 'menus':       return this.menu(arg_name)

				case 'menubar':
				case 'menubars':    result = this.menubar(arg_name)
					// console.log('package.find_resource ' + arg_name + ' in package ' + this.get_name() + ' for menubars', result)
					return result
			}
			return undefined
		}

		return this.service(arg_name)
			|| this.feature(arg_name)
			|| this.datasource(arg_name)
			|| this.model(arg_name)
			|| this.view(arg_name)
			|| this.menu(arg_name)
			|| this.menubar(arg_name)
	}



	/**
	 * Get resources names.
	 * 
	 * @param {string} arg_type - resource type name (optional).
	 * 
	 * @returns {array} - resources names list.
	 */
	get_resources_names(arg_type=undefined)
	{
		// console.log(context + ':get_resources_names:get resources names for type=%s', arg_type)

		if (arg_type)
		{
			switch(arg_type) {
				case 'command':
				case 'commands':    return this.commands().get_all_names()
				
				case 'service':
				case 'services':    return this.services().get_all_names()
				
				case 'feature':
				case 'features':    return this.features().get_all_names()

				case 'datasource':
				case 'datasources': return this.datasources().get_all_names()

				case 'model':
				case 'models':      return this.models().get_all_names()
				
				case 'view':
				case 'views':       return this.views().get_all_names()

				case 'menu':
				case 'menus':       return this.menus().get_all_names()

				case 'menubar':
				case 'menubars':    return this.menubars().get_all_names()
			}
			return []
		}

		const types = ['commands', 'services', 'features', 'datasources', 'models', 'views', 'menus', 'menubars']
		let names = []
		_.forEach(types,
			(type)=>{
				const type_resources = this[type]().get_resources_names()
				names = names.concat(type_resources)

				// DEBUG
				// console.log(context + ':get_resources_names:resources for type=%s', type, type_resources)
				// console.log(context + ':get_resources_names:resources all types', names)
			}
		)
		return names
	}
}
