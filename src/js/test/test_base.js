
// NPM IMPORTS
import {describe, it} from 'mocha'
import {expect} from 'chai'

// COMMON IMPORTS
import T from '../utils/types'
import Collection from '../base/collection'
import Resource from '../base/resource'



describe('common/base',
	() => {
		it('Collection',
			() => {
				let items = new Collection()
				let res1 = new Resource('res1', { setting1:'ABC' })
				let res2 = new Resource('res2', { setting2:'ABC' })
				let res3 = new Resource('res3', { setting3:'ABC' })
				
				items.add(res1)
				items.add(res2)
				items.add(res3)
				
				let found1 = items.find_by_name('res1')
				expect( T.isObject(found1) ).to.be.true
				expect(found1.$name == 'res1').to.be.true
				expect(found1.$type == 'resources').to.be.true
				expect(found1.$class == 'Resource').to.be.true
				expect(found1.$settings.setting1 == 'ABC').to.be.true
			}
		)
	}
)

// curl http://localhost:8080/tutorial-rest/api/v1/views/VIEW_HOME
