
// NPM IMPORTS
import winston from 'winston'

// COMMON IMPORTS
import T from '../utils/types'
import Logger from './logger'


// const context = 'common/loggers/logger_winston'



const customLevels = {
	levels: {
		debug: 3,
		info: 2,
		warn: 1,
		error: 0
	},
	colors: {
		debug: 'blue',
		info: 'green',
		warn: 'yellow',
		error: 'red'
	}
}



/**
 * @file Winston logger class.
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class LoggerWinston extends Logger
{
	/**
	 * Create a Winston Logger instance.
	 * @param {string} arg_context - trace context.
	 * @returns {nothing}
	 */
	constructor(arg_enabled, arg_settings)
	{
		super(arg_enabled)
		
		this.is_logger_winston = true

		let transports = []
		
		// console.log(arg_settings, context + ':' + arg_settings)
		if ( T.isObject(arg_settings) )
		{
			if ( T.isObject(arg_settings.transports) )
			{
				// console.log(context + ':transport config found', arg_settings.transports)
				const transports_names = Object.keys(arg_settings.transports)
				transports_names.forEach(
					(transport_name) => {
						const transport_cfg = arg_settings.transports[transport_name]
						
						if ( ! T.isString(transport_cfg.type) )
						{
							return
						}
						
						switch(transport_cfg.type)
						{
							case 'file': {
								const transport = this.create_file_transport(transport_cfg)
								transports.push(transport)
								break
							}
							case 'console': {
								const transport = this.create_console_transport(transport_cfg)
								transports.push(transport)
								break
							}
						}
					}
				)
			}
		}
		
		if ( transports.length == 0 )
		{
			// console.log(context + ':no transport config found')
			const console_transport = this.create_console_transport(undefined)
			const file_transport = this.create_file_transport(undefined)
			transports.push(console_transport)
			transports.push(file_transport)
		}
		
		const logger_cfg = {
			levels: customLevels.levels,
			colors: customLevels.colors,
			transports: transports
		}
		
		this.logger = new (winston.Logger)(logger_cfg)

		winston.addColors(customLevels.colors)
	}
	
	
	
	/**
	 * Create a console transport for Winston logger.
	 * @param {object} arg_transport_cfg - console transport settings.
	 * @returns {winston.transports.Console}
	 */
	create_console_transport(arg_transport_cfg)
	{
		arg_transport_cfg = T.isObject(arg_transport_cfg) ? arg_transport_cfg : {}

		// DEFAULT CONFIGURATION
		const default_transport_cfg = {
			level:'debug',
			
			timestamp: false,
			
			formatter: function(options)
			{
				const msg = undefined !== options.message ? options.message : ''
				const meta = options.meta && Object.keys(options.meta).length ? options.meta : undefined
				// const payload = meta ? '\n\t' + JSON.stringify(meta) : '' 
				return /*options.timestamp().toString().substr(-6) +*/' pid='+ process.pid + ' '+ winston.config.colorize( options.level, options.level.toUpperCase() )
					+ msg
					+ '\n\t' + meta[0] // TS
					+ ' : ' + meta[1] // CONTEXT
					+ ' : ' + meta[2] // NAME
					+ ' : ' + meta[4] // ACTION
					+ ' : ' + meta[3] // ?
					+ '\n\t text = ' + meta[5] // TEXT
			},
			
			colorize:true
		}
		
		// CHECK CONFIGURATION
		if ( ! T.isString(arg_transport_cfg.level) || ! (arg_transport_cfg.level in customLevels.levels) )
		{
			arg_transport_cfg.level = default_transport_cfg.level
		}
		if ( ! T.isFunction(arg_transport_cfg.timestamp) )
		{
			arg_transport_cfg.timestamp = default_transport_cfg.timestamp
		}
		if ( ! T.isFunction(arg_transport_cfg.formatter) )
		{
			arg_transport_cfg.formatter = default_transport_cfg.formatter
		}
		
		return new (winston.transports.Console)(arg_transport_cfg)
	}
	
	
	/**
	 * Create a file transport for Winston logger.
	 * @param {object} arg_transport_cfg - file transport settings.
	 * @returns {winston.transports.File}
	 */
	create_file_transport(arg_transport_cfg)
	{
		arg_transport_cfg = T.isObject(arg_transport_cfg) ? arg_transport_cfg : {}
		
		// DEFAULT CONFIGURATION
		const default_transport_cfg = {
			level: 'debug',
			
			timestamp: function()
			{
				return Date.now()
			},
			
			formatter: function(options)
			{
				return options.timestamp().toString().substr(-6) +' '+ process.pid +' '+ options.level.toUpperCase() +' '+ (undefined !== options.message ? options.message : '') +
					(options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' )
			},
			
			filename: './tmp/debug.log',
			maxsize:100000,
			maxFiles:2
		}
		const max_size = 100000000
		const max_files = 100
		
		// CHECK CONFIGURATION
		if ( ! T.isString(arg_transport_cfg.level) || ! (arg_transport_cfg.level in customLevels.levels) )
		{
			arg_transport_cfg.level = default_transport_cfg.level
		}
		if ( ! T.isFunction(arg_transport_cfg.timestamp) )
		{
			arg_transport_cfg.timestamp = default_transport_cfg.timestamp
		}
		if ( ! T.isFunction(arg_transport_cfg.formatter) )
		{
			arg_transport_cfg.formatter = default_transport_cfg.formatter
		}
		if ( ! T.isString(arg_transport_cfg.filename) )
		{
			arg_transport_cfg.filename = default_transport_cfg.filename
		}
		if ( ! T.isNumber(arg_transport_cfg.maxsize) )
		{
			arg_transport_cfg.maxsize = default_transport_cfg.maxsize
		}
		if ( ! T.isNumber(arg_transport_cfg.maxFiles) )
		{
			arg_transport_cfg.maxFiles = default_transport_cfg.maxFiles
		}
		arg_transport_cfg.maxsize = Math.min(arg_transport_cfg.maxsize, max_size)
		arg_transport_cfg.maxFiles = Math.min(arg_transport_cfg.maxFiles, max_files)
		
		return new (winston.transports.File)(arg_transport_cfg)
	}
	
	
	
	/**
	 * Logger DEBUG implementation.
	 * 
	 * @param {array} arg_opds - log record array.
	 * 
	 * @returns {nothing}
	 */
	debug_self(arg_opds)
	{
		this.logger.log('debug', arg_opds)
	}
	
	
	/**
	 * Logger INFO implementation.
	 * 
	 * @param {array} arg_opds - log record array.
	 * 
	 * @returns {nothing}
	 */
	info_self(arg_opds)
	{
		this.logger.log('info', arg_opds)
	}
	
	
	/**
	 * Logger WARN implementation.
	 * 
	 * @param {array} arg_opds - log record array.
	 * 
	 * @returns {nothing}
	 */
	warn_self(arg_opds)
	{
		this.logger.log('warn', arg_opds)
	}
	
	
	/**
	 * Logger ERROR implementation.
	 * 
	 * @param {array} arg_opds - log record array.
	 * 
	 * @returns {nothing}
	 */
	error_self(arg_opds)
	{
		this.logger.log('error', arg_opds)
	}
}
