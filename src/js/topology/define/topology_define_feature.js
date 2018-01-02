// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T from '../../utils/types'
import TopologyDefineItem from './topology_define_item'


let context = 'common/topology/define/topology_define_feature'



/**
 * @file TopologyDefineFeature class: describe a feature topology item.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class TopologyDefineFeature extends TopologyDefineItem
{
	/**
	 * Create a TopologyDefineFeature instance.
	 * @class TopologyDefineFeature
	 * @extends TopologyDefineItem
	 * 
	 * SETTINGS FORMAT:
	 * 	"features":
	 * 		"featureA":
	 * 			"type":"security",
	 * 			"routes":[
	 * 				Objects with:
	 * 					"route":"/login",
	 * 					"action":"login"
	 * 			]
	 * 		"featureB":
	 * 			"type":"html_assets",
	 * 			"routes":[
	 * 				Objects with:
	 * 					"route":"/assets2",
	 * 					"directory":"./public/tutorial-1",
	 * 					"default_file":"index.html"
	 * 			]
	 * 		"featureC":
	 * 			"type":"messages"
	 * 		"featureCDe":"middleware",
	 * 			"routes":[
	 * 				Objects with:
	 * 					"route":"/home",
	 * 					"page_view":"metrics_tabs",
	 * 					"page_menubar":"default_menubar"=
	 * 			]
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
		super(arg_name, arg_settings, 'TopologyDefineFeature', log_context)
		
		this.is_topology_define_feature = true

		this.topology_type = 'features'
		
		this.topology_feature_type = this.get_setting_js('type', undefined)
		
		this._errors = undefined
		
		this.info('Feature is created')
		console.log('feature is created:' + this.get_name())
	}
	


	/**
	 * Check functional format.
	 * 
	 * @returns {boolean}
	 */
	is_valid()
	{
		try{
			// TODO: CHECK TYPE
			assert( T.isString(this.topology_feature_type), context)
		}
		catch(e)
		{
			return false
		}

		return ! T.isArray(this._errors)
	}
}
