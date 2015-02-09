var options = libRequire('../options');

var ldapProtocol = options.ldap.ldaps ? 'ldaps' : 'ldap';
var ldapjs = require('ldapjs').createClient({
  url: ldapProtocol +
      '://' + options.ldap.hostname +
      ':' + options.ldap.port,
  timeout: undefined, // inifinty TODO: fixme
  connectTimeout: undefined, // OS-determined TODO: fixme
  maxConnections: 3, // TODO: stress test to figure out
  bindDN: options.ldap.adminDn,
  bindCredentials: options.ldap.adminPassword,
  checkInterval: undefined, // TODO: research me
  maxIdleTime: undefined // TODO: research me
});

var roleToAction = function (req, res, next) {
  if (req.role) {
    return next();
  }
  else {
    if (req.user) {
      return res.status(403).end();
    }
    else {
      return res.status(401).end();
    }
  }
};

module.exports = {
  rolesMap: options.rolesMap,

  // roles are in order of preference for the route. first is preferred
  roles: function (roles) {
    return function (req, res, next) {
      var filterClauses = [];
      var potentialRoles = {};
      var foundRoles = {};
      roles.forEach(function (role) {
        if (role === 'default') {
          // if nothing else happens, this role will be used
          req.role = options.rolesMap[role];
        }
        else {
          potentialRoles[role] = options.rolesMap[role];
          filterClauses.push('(cn=' + role + ')');
        }
      });
      if (!filterClauses.length || !req.user) {
        return roleToAction(req, res, next);
      }
      else {
        // is the user.uid a member of any of these roles?

        // the user must be in either contirbutors or admins -- this is not
        // a real-world scenario for samplestack at this time
        /*
  dc=samplestack,dc=org" "(&(objectclass=groupOfNames)(uniqueMember=uid
  =joeUser@marklogic.com,ou=people,dc=samplestack,dc=org)
  (|(cn=admins)(cn=contributors)))
        */
        // we'll get results from the event emitter -- waiting for all
        // results to come in. TODO: is it better to ask for all relevvant
        // roles and wait for all responses or start with preferred and only
        // go to the next on if necessary? This isn't a samplestack concern
        // console.log('in roles, user: ' + JSON.stringify(req.user));
        var filter = '(&(objectclass=groupOfNames)(uniqueMember=uid=' +
            req.user.uid +
            ',ou=people,dc=samplestack,dc=org)(|' +
            filterClauses.join() +
            '))';

        // console.log('filter: ' + filter);

        var expectedCount = filterClauses.length;
        ldapjs.search(
          'dc=samplestack,dc=org',
          {
            filter: filter,
            attributes: ['cn'],
          },
          function (err, ldapres) {
            if (err) {
              return next(err);
            }

            ldapres.on('error', function (err) {
              return next(err);
            });
            ldapres.on('searchEntry', function (entry) {
              foundRoles[entry.object.cn] = potentialRoles[entry.object.cn];
              // console.log('in roles, role: ' + entry.object.cn);
            });

            ldapres.on('end', function () {
              // console.log('in roles, end');
              var i;
              var foundOne;
              var role;
              for (
                i = 0, foundOne = false;
                i < roles.length;
                i++
              ) {
                role = roles[i];
                if (role !== 'default' && foundRoles[role]) {
                  foundOne = true;
                  req.role = foundRoles[role];
                  roleToAction(req, res, next);
                }
              }
              if (!foundOne) {
                roleToAction(req, res, next);
              }
            });
          }
        );
      }
    };
  }


};
