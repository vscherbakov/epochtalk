var Joi = require('joi');
var Promise = require('bluebird');

/**
  * @apiVersion 0.4.0
  * @apiGroup Reports
  * @api {GET} /reports/messagenotes/:messageReportId (Admin) Page Message Report Notes
  * @apiName PageMessageReportNotes
  * @apiPermission Super Administrator, Administrator, Global Moderator, Moderator
  * @apiDescription Used to page through message moderation report notes.
  *
  * @apiParam {string} messageReportId The unique id of the message report to retrieve notes for
  *
  * @apiParam (Query) {number} [page=1] The page of message report notes to retrieve
  * @apiParam (Query) {number} [limit=10] The number of message report notes to retrieve per page
  * @apiParam (Query) {boolean} [desc=true] Boolean indicating whether or not to sort the results in descending order
  *
  * @apiSuccess {number} count The total number of report notes
  * @apiSuccess {number} limit The number of report notes to bring back per page
  * @apiSuccess {number} page The current page of report notes brought back
  * @apiSuccess {number} page_count The total number of pages
  * @apiSuccess {boolean} desc Boolean indicating if the results are in descending order
  * @apiSuccess {object[]} data An array of message report note objects.
  * @apiSuccess {string} data.id The unique id of the message report note
  * @apiSuccess {string} data.report_id The unique id of the message report this note is for
  * @apiSuccess {string} data.user_id The unique id of the user who left the note
  * @apiSuccess {string} data.username The username of the user who left the note
  * @apiSuccess {string} data.avatar The URL to the avatar of the user who left the note
  * @apiSuccess {string} data.note The note message that was left on the report
  * @apiSuccess {timestamp} data.created_at Timestamp of when the report note was created
  * @apiSuccess {timestamp} data.updated_at Timestamp of when the report note was last updated
  *
  * @apiError (Error 500) InternalServerError There was an error retrieving the message report notes
  */
module.exports = {
  method: 'GET',
  path: '/api/reports/messagenotes/{report_id}',
  config: {
    auth: { strategy: 'jwt' },
    validate: {
      params: { report_id: Joi.string().required() },
      query: {
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        desc: Joi.boolean().default(true)
      }
    },
    pre: [ { method: 'auth.reports.messages.notes.page(server, auth)' } ]
  },
  handler: function(request, reply) {
    var reportId = request.params.report_id;
    var opts = {
      limit: request.query.limit,
      page: request.query.page,
      desc: request.query.desc
    };

    var reportNotes = request.db.reports.pageMessageReportsNotes(reportId, opts);
    var reportNotesCount = request.db.reports.messageReportsNotesCount(reportId);

    var promise = Promise.join(reportNotes, reportNotesCount, function(notes, count) {
      return {
        data: notes,
        count: count,
        limit: opts.limit,
        page: opts.page,
        page_count: Math.ceil(count / opts.limit),
        desc: opts.desc
      };
    })
    .error(request.errorMap.toHttpError);

    return reply(promise);
  }
};
