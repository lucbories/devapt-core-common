// NPM IMPORTS
// import assert from 'assert'

// COMMON IMPORTS
import TopologyDefineItem from './topology_define_item'


let context = 'common/topology/define/topology_define_menu'



/**
 * @file Menu class: describe a Menu topology item.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class TopologyDefineMenu extends TopologyDefineItem
{
	/**
	 * Create a TopologyDefineMenu instance.
	 * @extends TopologyDefineItem
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
		super(arg_name, arg_settings, 'TopologyDefineMenu', log_context)
		
		this.is_topology_define_menu = true

		this.topology_type = 'menus'
	}
}
