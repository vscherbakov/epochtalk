var Joi = require('joi');

/**
  * @apiVersion 0.4.0
  * @apiGroup Posts
  * @api {DELETE} /posts/:id/purge Purge
  * @apiName PurgePost
  * @apiPermission Admin
  * @apiDescription Used to purge a post.
  *
  * @apiParam {string} id The Id of the post to purge
  *
  * @apiSuccess {string} user_id The id of the user who created the post
  * @apiSuccess {string} thread_id The id of the thread that the post belonged to
  *
  * @apiError (Error 500) InternalServerError There was an issue purging the post
  */
module.exports = {
  method: 'DELETE',
  path: '/api/posts/{id}/purge',
  config: {
    app: { post_id: 'params.id' },
    auth: { strategy: 'jwt' },
    plugins: {
      mod_log: {
        type: 'posts.purge',
        data: {
          id: 'params.id',
          user_id: 'route.settings.plugins.mod_log.metadata.user_id',
          thread_id: 'route.settings.plugins.mod_log.metadata.thread_id'
        }
      }
    },
    validate: { params: { id: Joi.string().required() } },
    pre: [ { method: 'auth.posts.purge(server, auth, params.id)' } ],
    handler: function(request, reply) {
      var promise = request.db.posts.purge(request.params.id)
      .then(function(purgedPost) {
        // append purged post data to plugin metadata
        request.route.settings.plugins.mod_log.metadata = {
          user_id: purgedPost.user_id,
          thread_id: purgedPost.thread_id
        };
      })
      .error(request.errorMap.toHttpError);

      return reply(promise);
    }
  }
};
