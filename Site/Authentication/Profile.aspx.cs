﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Net;
using System.Web.Script.Serialization;
using Core;

namespace Site.Authentication
{
    public partial class Success : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                try
                {

                    string sessionId = Session["UserData"].ToString();
                    WebClient client = new WebClient();
                    client.Encoding = System.Text.Encoding.UTF8;
                    var json = client.DownloadString(Campus.SDK.Client.ApiEndpoint + "User/GetCurrentUser?sessionId=" + sessionId);
                    var serializer = new JavaScriptSerializer();
                    Dictionary<string, object> respDictionary = serializer.Deserialize<Dictionary<string, object>>(json);

                    Dictionary<string, object> Data = (Dictionary<string, object>)respDictionary["Data"];
                    Photo.ImageUrl = Data["Photo"].ToString();
                    ParsePersonData(Data);
                    ParseEmployees(Data);
                    ParseProfiles(Data);

                    var answer = Helper.GetData("http://api.ecampus.kpi.ua/User/GetEffectivePermissions?sessionId=" + sessionId);

                    if (answer != null)
                    {
                        var DataArr = (ArrayList)answer["Data"];
                        GetEffectivePremissions(DataArr);

                    }
                    else throw (new Exception("Права пользователя не получены!"));
                }
                catch (Exception ex)
                {
                    PersData.Text = "<h1>Ошибка при загрузке страницы!!!<h1>";
                }
            }
        }

        void ParsePersonData(Dictionary<string, object> Data)
        {

            PersData.Text += "<p style=\"margin-left:10px;\" class=\"text-primary\">" + Data["FullName"] + "</p>";
        }

        void ParseEmployees(Dictionary<string, object> Data)
        {

            ArrayList Personalitiess = (ArrayList)Data["Personalities"];
            ArrayList Employees = (ArrayList)Data["Employees"];

            for (int i = 0; i < Personalitiess.Count; i++)
            {
                foreach (KeyValuePair<string, object> w in (Dictionary<string, object>)Personalitiess[i])
                {
                    if (w.Key == "SubdivisionId")
                    {

                    }
                    else if (w.Key == "SubdivisionName")
                    {
                        WorkData.Text += "<p style=\"margin-left:10px;\" class=\"text-primary\">" + w.Value + "</p>";
                    }
                    else if (w.Key == "StudyGroupName")
                    {
                        WorkData.Text += "<p style=\"margin-left:20px;\" class=\"text-info\">" + "Група: <i class=\"text-success\">" + w.Value + "</i></p>";
                    }
                    else if (w.Key == "IsContract")
                    {
                        var val = "ні";
                        if (w.Value.ToString().ToLower() == "true") { val = "так"; }
                        WorkData.Text += "<p style=\"margin-left:20px;\" class=\"text-info\">" + "Контрактна форма навчання: <i class=\"text-success\">" + val + "</i></p>";
                    }
                    else if (w.Key == "Specialty")
                    {
                        WorkData.Text += "<p style=\"margin-left:20px;\" class=\"text-info\">" + "Спеціальність: <i class=\"text-success\">" + w.Value + "</i></p>";
                    }

                }
            }

            for (int i = 0; i < Employees.Count; i++)
            {
                foreach (KeyValuePair<string, object> w in (Dictionary<string, object>)Employees[i])
                {
                    if (w.Key == "SubdivisionId")
                    {

                    }
                    else if (w.Key == "SubdivisionName")
                    {
                        WorkData.Text += "<p style=\"margin-left:10px;\" class=\"text-primary\">" + w.Value + "</p>";
                    }
                    else if (w.Key == "Position")
                    {
                        WorkData.Text += "<p style=\"margin-left:20px;\" class=\"text-info\">" + " Позиція: <i class=\"text-success\">" + w.Value + "</i></p>";
                    }
                    else if (w.Key == "AcademicDegree")
                    {
                        WorkData.Text += "<p style=\"margin-left:20px;\" class=\"text-info\">" + "Академічний ступінь: <i class=\"text-success\">" + w.Value + "</i></p>";
                    }
                }
            }
        }

        void ParseProfiles(Dictionary<string, object> Data)
        {

            ArrayList Profiles = (ArrayList)Data["Profiles"];

            SpecFunc.Text += "<div style=\"margin-left:10px;\" class=\"text-success\">";


            for (int i = 0; i < Profiles.Count; i++)
            {
                foreach (KeyValuePair<string, object> pk in (Dictionary<string, object>)Profiles[i])
                {

                    switch (pk.Key)
                    {

                        case "SubsystemName":
                            {
                                SpecFunc.Text += "<p class=\"text-primary\">" + "\"" + pk.Value + "\"";
                                break;
                            }
                        case "ProfileName":
                            {
                                SpecFunc.Text += "<i class=\"text-success\">" + "( " + pk.Value + " )" + "</i></p>";
                                break;
                            }
                        default:
                            {
                                break;
                            }
                    }

                }
            }
            SpecFunc.Text += "</div>";
        }

        protected void GetEffectivePremissions(ArrayList Data)
        {
            Dictionary<string, Premission> premDic = new Dictionary<string, Premission>();
            for (int i = 0; i < Data.Count; i++)
            {
                Premission premObj = null;

                foreach (KeyValuePair<string, object> pk in (Dictionary<string, object>)Data[i])
                {

                    bool prem = true;

                    if (pk.Value.ToString().ToLower() == "false")
                    {
                        prem = false;
                    }

                    switch (pk.Key)
                    {

                        case "SubsystemName":
                            {
                                premObj = new Premission(pk.Value.ToString());
                                break;
                            }
                        case "IsCreate":
                            {
                                premObj.create = prem;
                                break;
                            }
                        case "IsRead":
                            {
                                premObj.read = prem;
                                break;
                            }
                        case "IsUpdate":
                            {
                                premObj.update = prem;
                                break;
                            }
                        case "IsDelete":
                            {
                                premObj.delete = prem;
                                break;
                            }
                        default:
                            {
                                break;
                            }
                    }

                }
                if (premObj != null) premDic.Add(premObj.subsystem, premObj);
                else throw (new Exception("Права пользователя не получены!"));
            }
            Session["UserPremissions"] = premDic;
        }

        protected void SavePass_Click(object sender, EventArgs e)
        {
            var currentPass = Session["UserPass"].ToString();
            if (OldPass.Text == currentPass)
            {
                if (NewPass.Text == NewPassCheak.Text)
                {
                    Dictionary<string, object> answer = null;

                    answer = Helper.GetData("http://api.ecampus.kpi.ua//user/ChangePassword?sessionId=" + Session["UserData"].ToString() + "&old=" + OldPass.Text + "&password=" + NewPass.Text);

                    if (answer == null)
                    {
                        OldPassLabel.CssClass = "label label-danger";
                        OldPassLabel.Text = "Помилка сервера";
                        NewPassLabel.CssClass = "label label-danger";
                        NewPassLabel.Text = "Помилка сервера";
                        ChangePass.Attributes.Add("style", "display:inline;");
                    }
                    else
                    {
                        if (NewPassLabel.CssClass == "label label-danger" || OldPassLabel.CssClass == "label label-danger")
                        {
                            OldPassLabel.CssClass = "label label-primary";
                            OldPassLabel.Text = "Старий пароль";
                            NewPassLabel.CssClass = "label label-primary";
                            NewPassLabel.Text = "Новий пароль";
                            NewPassCheakLabel.CssClass = "label label-primary";
                            NewPassCheakLabel.Text = "Повторіть новий пароль";
                            ChangePass.Attributes.Add("style", "display:none;");
                        }
                        Session["UserPass"] = NewPass.Text;
                    }
                }
                else
                {
                    OldPassLabel.CssClass = "label label-primary";
                    OldPassLabel.Text = "Старий пароль";
                    NewPassLabel.CssClass = "label label-danger";
                    NewPassLabel.Text = "Новий пароль не співпав";
                    NewPassCheakLabel.CssClass = "label label-danger";
                    NewPassCheakLabel.Text = "Новий пароль не співпав";
                    ChangePass.Attributes.Add("style", "display:inline;");
                }
            }
            else
            {
                OldPassLabel.CssClass = "label label-danger";
                OldPassLabel.Text = "Старий пароль неправильний";
                NewPassLabel.CssClass = "label label-primary";
                NewPassLabel.Text = "Новий пароль";
                NewPassCheakLabel.CssClass = "label label-primary";
                NewPassCheakLabel.Text = "Повторіть новий пароль";
                ChangePass.Attributes.Add("style", "display:inline;");
            }
        }


    }
}