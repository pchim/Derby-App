var derby = require('derby');

var app = module.exports = derby.createApp('todost', __filename);

global.app = app;

app.loadViews(__dirname + '/views');
app.loadStyles(__dirname + '/css');

app.on('model', function(model) {
  model.fn('all',       function(item) { return true; });
  model.fn('completed', function(item) { return  item.completed;});
  model.fn('active',    function(item) { return !item.completed;});

  model.fn('counters', function(todos) {
    var counters = { active: 0, completed: 0 };
    for (var id in todos) {
      if (todos[id].completed) counters.completed++;
      else counters.active++;
    }
    return counters;
  })
});

app.get('/',          getPage('all'));
app.get('/active',    getPage('active'));
app.get('/completed', getPage('completed'));

app.proto.addTodo = function(newTodo) {
  if (!newTodo) return;

  this.model.add('todos', {
    text: newTodo,
    completed: false
  });

  this.model.set('_page.newTodo', '');
}

app.proto.clearCompleted = function() {
  var todos = this.model.get('todos');
  for (var id in todos) {
    if (todos[id].completed) this.model.del('todos.' + id);
  }
}

app.proto.editTodo = function(oldTodo) {
  this.model.set('_page.edit.id', oldTodo.id);
  this.model.set('_page.edit.text', oldTodo.text);

  window.getSelection().removeAllRanges();
  document.getElementById(oldTodo.id).focus();
}

app.proto.doneEditing = function(newEdit) {
  this.model.set('todos.' + newEdit.id + '.text',  newEdit.text);
  this.model.set('_page.edit', {
    id: undefined,
    text: ''
  })
}

app.proto.cancelEditing = function(e) {
  if (e.keyCode === 27) {
    this.model.set('_page.edit', '');
  }
}

function getPage(filter){
  return function(page, model){
    model.subscribe('todos', function() {
      model.filter('todos', filter).ref('_page.todos');
      model.start('_page.counters', 'todos', 'counters');
      page.render();
    });
  }
}