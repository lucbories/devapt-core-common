// NPM IMPORTS
import assert from 'assert'
import path from 'path'

// COMMON IMPORTS
import T                     from '../utils/types'
import RenderingPlugin       from '../plugins/rendering_plugin'
import * as DefaultRendering from '../rendering/index'

/**
 * Plugin file name.
 * @private
 * @type {string}
 */
const plugin_name = 'DefaultRendering'

/**
 * Contextual constant for this file logs.
 * @private
 * @type {string}
 */
const context = 'common/' + plugin_name + '/rendering_default_plugin'



/**
 * Plugin class for default rendering plugin.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class DefaultDefaultRendering extends RenderingPlugin
{
	/**
	 * Create a DefaultDefaultRendering instance.
	 * 
	 * @param {RuntimeBase} arg_runtime - runtime instance.
	 * @param {PlugindManager} arg_manager - plugins manager instance.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_runtime, arg_manager)
	{
		assert( T.isObject(arg_runtime) && arg_runtime.is_base_runtime, context + ':constructor:bad runtime instance' )
		assert( T.isObject(arg_manager), context + ':constructor:bad plugins manager instance' )

		super(arg_runtime, arg_manager, 'DefaultRendering', '1.0.0')

		const assets_dir = '../../../public/'
		this.add_public_asset('css', '/' + plugin_name + '/normalize.css',       path.join(__dirname, assets_dir, 'css/normalize.css') )
		this.add_public_asset('img', '/' + plugin_name + '/favico.png',          path.join(__dirname, assets_dir, 'img/favico.png') )
		this.add_public_asset('js',  '/' + plugin_name + '/browser.min.js',      path.join(__dirname, assets_dir, 'js/vendor/browser.min.js') )
		this.add_public_asset('js',  '/' + plugin_name + '/jquery.min.js',       path.join(__dirname, assets_dir, 'js/vendor/jquery.min.js') )
		this.add_public_asset('js',  '/' + plugin_name + '/jquery.min.map',      path.join(__dirname, assets_dir, 'js/vendor/jquery.min.map') )
		this.add_public_asset('js',  '/' + plugin_name + '/devapt-bootstrap.js', path.join(__dirname, assets_dir, 'js/devapt-bootstrap.js') )

		const browser_assets_dir = '../../../../devapt-core-browser/public'
		this.add_public_asset('js',  '/' + plugin_name + '/devapt-core-browser.js', path.join(__dirname, browser_assets_dir, 'js/build/devapt-core-browser.js') )
	}



	/**
	 * Get plugin js asset files for browser loading.
	 * 
	 * @returns {string}
	 */
	get_browser_plugin_file_url()
	{
		// return plugin_name + '/devapt-default-rendering.js'
		return undefined
	}

	
    
	/**
     * Get a feature class.
	 * 
     * @param {string} arg_class_name - feature class name.
     * 
	 * @returns {object|undefined} feature class.
     */
	get_feature_class(arg_class_name)
	{
		assert( T.isString(arg_class_name), context + ':get_feature_class:bad class string')
		
		return undefined
	}

	

	/**
     * test if plugin has a feature class.
	 * 
     * @param {string} arg_class_name - feature class name.
     * 
	 * @returns {boolean}
     */
	has(arg_class_name)
	{
		assert( T.isString(arg_class_name), context + ':has:bad class string')
		
		switch(arg_class_name.toLocaleLowerCase())
		{
			// SPECIAL CASE, NOT RENDERING FUNCTIONS
			case 'rendering_normalize':
			case 'renderingresult':
			case 'rendering_factory':
				return true
			
			// RENDERING FUNCTIONS
			case 'component':
			case 'container':
			case 'button':
			case 'canvas':
			case 'label':
			case 'anchor':
			case 'image':
			case 'inputfield':
			case 'input':
			case 'input-field':
			case 'list':
			case 'table':
			case 'recordstable':
			case 'script':
			case 'menubar':
			case 'page':
			case 'page_content':
			case 'tabs':
			case 'tree':
			case 'tabletree':
			case 'hbox':
			case 'vbox':
			case 'textarea':
			case 'dock':
				return true
		}
		
		return false
	}
	

	
	/**
	 * Find a rendering function.
	 * @static
	 * 
	 * @param {string} arg_type - rendering item type.
	 * 
	 * @returns {Function} - rendering function.
	 */
	static find_rendering_function(arg_type)
	{
		if ( ! T.isString(arg_type) )
		{
			return undefined
		}
		
		switch(arg_type.toLocaleLowerCase())
		{
			// SPECIAL CASE, NOT RENDERING FUNCTIONS
			case 'rendering_normalize':
				return DefaultRendering.rendering_normalize

			case 'renderingresult':
				return DefaultRendering.RenderingResult

			case 'rendering_factory':
				return DefaultRendering.rendering_factory
			
			// RENDERING FUNCTIONS
			case 'component':
				return DefaultRendering.component
			
			case 'container':
				return DefaultRendering.container

			case 'button':
				return DefaultRendering.button

			case 'canvas':
				return DefaultRendering.canvas
			
			case 'label':
				return DefaultRendering.label
			
			case 'anchor':
				return DefaultRendering.anchor
			
			case 'image':
				return DefaultRendering.image
			
			case 'inputfield':
			case 'input':
			case 'input-field':
				return DefaultRendering.input_field

			case 'list':
				return DefaultRendering.list
			
			case 'table':
			case 'recordstable':
				return DefaultRendering.table
			
			case 'script':
				return DefaultRendering.script
			
			case 'menubar':
				return DefaultRendering.menubar
			
			case 'page':
				return DefaultRendering.page
			
			case 'page_content':
				return DefaultRendering.page_content
			
			case 'tabs':
				return DefaultRendering.tabs
			
			case 'tree':
				return DefaultRendering.tree

			case 'tabletree':
				return DefaultRendering.tabletree

			case 'hbox':
				return DefaultRendering.hbox
			
			case 'vbox':
				return DefaultRendering.vbox

			case 'textarea':
				return DefaultRendering.textarea

			case 'dock':
				return DefaultRendering.dock
		}

		return undefined
	}
}
