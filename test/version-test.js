import {expect} from 'chai'

describe('version', function () {
  it('should match the version from package.json', function () {
    var packageVersion = require('../package').version
    expect(require('../').version).to.equal(packageVersion)
  })
})
