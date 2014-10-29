define(['app/module'], function (module) {

  /**
   * @ngdoc domain
   * @name ssAnswer
   * @requires mlModelBase
   * @requires mlSchema
   *
   * @description
   * TBD
   */

  module.factory('ssAnswer', [

    '$q', 'mlModelBase', 'mlSchema', 'mlUtil', 'ssComment',
    function (
      $q, mlModelBase, mlSchema, mlUtil, ssComment
    ) {
      /**
       * @ngdoc type
       * @name SsAnswerObject
       * @description The model instance prototype for
       * {@link ssAnswer}.
       */

      /**
       * @ngdoc method
       * @name SsAnswerObject#constructor
       * @param {object} spec Data used to populate
       * the new instance.
       * @description Constructor. Uses default implementation.
       */
      var SsAnswerObject = function (spec, parent) {
        mlModelBase.object.call(this, spec, parent);
      };
      SsAnswerObject.prototype = Object.create(
        mlModelBase.object.prototype
      );

      // TODO when hasVoted endpoint is working
      // Object.defineProperty(SsAnswerObject.prototype, 'hasVoted', {
      //   get: function () {
      //     return this.parent.hasVotedOn(this.id);
      //   }
      // });

      SsAnswerObject.prototype.$mlSpec = {
        schema: mlSchema.addSchema({
          id: 'http://marklogic.com/samplestack#answer',
          //required: ['text'], // this is breaking validation on answer save
          properties: {
            id: {
              type: 'string',
              minLength: 36,
              maxLength: 36
            },
            text: { type: 'string' }
          }
        })
      };

      /**
       * @ngdoc method
       * @name SsAnswerObject#prototype.mergeData
       * @description Sets up comment model objects on data, then merges
       * data.
       * @param {object} data Data to merge.
       */
      SsAnswerObject.prototype.mergeData = function (data) {

        // Replace comments with ssComment objects
        angular.forEach(data.comments, function (comment, index) {
          data.comments[index] = ssComment.create(comment, this);
        });
        // Add empty ssComment object for posting new comment
        data.comments = data.comments || [];
        data.comments[data.comments.length] = ssComment.create({}, this);

        mlUtil.merge(this, data);
        this.testValidity();
      };

      /**
       * @ngdoc method
       * @name SsAnswerObject#prototype.addComment
       * @description Adds new ssComment object to end of comments array
       * @param {object} data Comment data.
       * @param {object} parent Comment parent.
       */
      SsAnswerObject.prototype.addComment = function (data, parent) {
        this.comments = this.comments || []; // Ensure an comments array exists
        this.comments[this.comments.length] = ssComment.create(data, parent);
      };

      SsAnswerObject.prototype.preconstruct = function (spec, parent) {
        // validate that parent is an ssQnaDoc object
      };

      SsAnswerObject.prototype.getResourceName = function (httpMethod) {
        return 'answers';
      };

      /**
       * @ngdoc method
       * @name SsAnswerObject#prototype.getHttpUrl
       * @description Returns URL string for accessing REST endpoint based
       * on HTTP method. Overrides mlModelBase method since the referencing
       * the parent object in the URL is required.
       * @param {string} httpMethod HTTP method.
       */
      SsAnswerObject.prototype.getHttpUrl = function (httpMethod) {
        switch (httpMethod) {
          case 'POST':
            return '/' + this.$ml.parent.getResourceName(httpMethod) +
            this.$ml.parent.getEndpointIdentifier(httpMethod) +
            '/' + this.getResourceName(httpMethod);
          default:
            throw new Error(
              'unsupported http method passed to getEndpoint: ' + httpMethod
            );
        }
      };

      /**
       * @ngdoc method
       * @name SsAnswerObject#prototype.onResponsePOST
       * @description Overrides mlModelBase method. Since endpoint returns
       * an entire QnaDoc object, the answer's parent method is called.
       * @param {string} data Response data
       */
      SsAnswerObject.prototype.onResponsePOST = function (data) {
        this.$ml.parent.onResponsePOST(data);
      };

      return mlModelBase.extend('SsAnswerObject', SsAnswerObject);
    }
  ]);
});
