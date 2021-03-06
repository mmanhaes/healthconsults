var records = [
    { id: 1, username: 'ceai-geral', password: 'geral2018', role: 'user', displayName: 'ceai-geral', emails: [ { value: 'marcelo.manhaes@hotmail.com' } ] }
  , { id: 2, username: 'ceai-admin', password: 'nancy2018',  role: 'admin', displayName: 'ceai-admin', emails: [ { value: 'marcelo.manhaes@hotmail.com' } ] }
  , { id: 3, username: 'ceai-coordenador', password: 'abibe2019',  role: 'admin', displayName: 'ceai-coordenador', emails: [ { value: 'marcelo.manhaes@hotmail.com' } ] }
];

exports.findById = function(id, cb) {
  process.nextTick(function() {
    var idx = id - 1;
    if (records[idx]) {
      cb(null, records[idx]);
    } else {
      cb(new Error('User ' + id + ' does not exist'));
    }
  });
};

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
};
