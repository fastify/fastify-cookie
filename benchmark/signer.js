const Benchmark = require('benchmark')
const SignerFactory = require('../signer')
const suite = new Benchmark.Suite()

const signer = SignerFactory('abcd')
const signedValue = signer.sign('test')
suite
  .add('sign', function () {
    signer.sign('test')
  })
  .add('unsign', function () {
    signer.unsign(signedValue)
  })
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .run({ delay: 0 })
