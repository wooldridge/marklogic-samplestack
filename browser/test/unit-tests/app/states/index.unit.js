define([
  './_layout.unit',
  './_root.unit',
  './explore.unit',
  './error.unit',
  './qnaDoc.unit'
], function (
  _layout,
  _root,
  explore,
  error,
  qnaDoc
) {

  return function () {

    describe('states', function () {
      _layout();
      _root();
      explore();
      error();
      qnaDoc();
    });

  };
});
