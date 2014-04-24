# Function to get the local IP address.
# Looks for the first IPv4 address that is not internal.
# Returns null if nothing is found.

module.exports = () ->
  ifaces = require('os').networkInterfaces()
  for ifaceName in Object.keys(ifaces)
    for iface in ifaces[ifaceName]
      console.log('examining iface: internal='+iface.internal + ', family=' + iface.family + ', address=' + iface.address)
      if !iface.internal && (iface.family == 'IPv4') then return iface.address
  null
