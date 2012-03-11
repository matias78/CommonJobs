﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using CommonJobs.Mvc;
using CommonJobs.MVC.UI.Attachments;

namespace CommonJobs.MVC.UI.Controllers
{
    public class AttachmentsController : CommonJobsController
    {
        //TODO: permitir no usar los nombres de las acciones
        [HttpGet]
        public ActionResult Get(string id, string contentType = "application/octet-stream", string fileName = null)
        {
            var stream = Query(new ReadAttachment() { Id = id });
            if (string.IsNullOrWhiteSpace(fileName))
                return File(stream, contentType);
            else
                return File(stream, contentType, fileName);
        }

        [HttpPost]
        public ActionResult Post(string fileName)
        {
            var attachment = ExecuteCommand(new SaveAttachment() { Request = this.Request });
            return Json(new { success = true, attachment = attachment });
        }
    }
}
