/*
 * Copyright 2019 Aimprosoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.switcher.login.webscript;

import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.extensions.surf.UserFactory;
import org.springframework.extensions.surf.exception.ConnectorServiceException;
import org.springframework.extensions.surf.support.AlfrescoUserFactory;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptRequest;
import org.springframework.extensions.webscripts.connector.*;
import org.springframework.extensions.webscripts.servlet.WebScriptServletRuntime;
import org.springframework.util.ReflectionUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

/**
 * Web script that handles the call to switching the user
 */
public class LoginSwitcherWebScript extends DeclarativeWebScript {

    private static final Logger logger = LogManager.getLogger(LoginSwitcherWebScript.class);

    private ConnectorService connectorService;

    private static final String FIELD_NAME = "id";
    private static final String SESSION_CREDENTIAL_VAULT_PROVIDER = "_alfwsf_vaults_credential.vault.provider";
    private static final String PREFIX_CONNECTOR_SESSION = "_alfwsf_consession_";

    /**
     * Getting userName and receiving ticket with admin rights for that user.
     * The received ticket will overwrite admin data in the session (the admin switches to this alfresco member)
     *
     * @param req    WebScriptRequest representing the request to this service
     * @param status Web Script status
     * @param cache  Web Script cache
     * @return custom service model
     */

    @Override
    protected Map<String, Object> executeImpl(WebScriptRequest req, Status status, Cache cache) {

        Map<String, Object> model = new HashMap<>();
        String user = null;

        // retrieve HttpServletRequest object
        final HttpServletRequest httpServletRequest = WebScriptServletRuntime.getHttpServletRequest(req);

        // retrieve current session
        final HttpSession session = httpServletRequest.getSession();

        // retrieve credential vault from the session
        final SimpleCredentialVault simpleCredentialVault = (SimpleCredentialVault) session.getAttribute(SESSION_CREDENTIAL_VAULT_PROVIDER);

        final Field id = ReflectionUtils.findField(SimpleCredentialVault.class, FIELD_NAME);

        ReflectionUtils.makeAccessible(id);

        // retrieve current user
        final String currentUser = (String) ReflectionUtils.getField(id, simpleCredentialVault);

        try {

            user = req.getParameter("user");
            logger.debug("UserName: " + user);

            final Connector connector = connectorService.getConnector(AlfrescoUserFactory.ALFRESCO_ENDPOINT_ID, currentUser, session);

            final String decodedUserName = java.net.URLEncoder.encode(user, "UTF-8");
            logger.debug("UserName decoded: " + decodedUserName);

            final String alfTicket = connector.getConnectorSession().getParameter(AlfrescoAuthenticator.CS_PARAM_ALF_TICKET);
            logger.debug("Alfresco ticket: " + alfTicket);

            // get a ticket for the selected user
            final Response call = connector.call("/api/switch-login?u=" + decodedUserName + "&pw=1&format=json&alf_ticket=" + alfTicket);

            // set the selected user in session
            if (call.getStatus().getCode() == Status.STATUS_OK) {
                logger.debug("Switching the user was processed successfully.");

                final String text = call.getText();

                final JSONObject jsonObject = new JSONObject(text);

                final String ticket = ((JSONObject) jsonObject.get("data")).getString("ticket");
                logger.debug("The new alfresco ticket for user " + user + ": " + ticket);

                connector.getConnectorSession().setParameter(AlfrescoAuthenticator.CS_PARAM_ALF_TICKET, ticket);

                ConnectorSession cs = (ConnectorSession) session.getAttribute(PREFIX_CONNECTOR_SESSION + AlfrescoUserFactory.ALFRESCO_ENDPOINT_ID);

                cs.setParameter(AlfrescoAuthenticator.CS_PARAM_ALF_TICKET, ticket);

                session.setAttribute(UserFactory.SESSION_ATTRIBUTE_KEY_USER_ID, user);
                logger.debug("The user " + user + " is set in the session.");

                // remove admin info from session
                session.setAttribute("_alf_USER_GROUPS", "");
                session.removeAttribute(UserFactory.SESSION_ATTRIBUTE_KEY_USER_OBJECT);
                logger.debug("Admin user was removed from session.");

                // set response status
                status.setCode(Status.STATUS_OK);
            } else {
                // receive description of the error
                JSONObject jsonErrObject = new JSONObject(call.getText());
                String errMessage = (String) ((JSONObject) jsonErrObject.get("status")).get("description");
                logger.error("User switching is failed due to an error :\n" + call.getText());
                // set error status and message
                status.setCode(Status.STATUS_BAD_REQUEST, errMessage);
            }


        } catch (ConnectorServiceException e) {
            logger.error("Could not establish connection to alfresco or some error occurs", e);
            status.setCode(Status.STATUS_INTERNAL_SERVER_ERROR, e.getMessage());
        } catch (JSONException e) {
            logger.error("Could not parse response into json object", e);
            status.setCode(Status.STATUS_INTERNAL_SERVER_ERROR, e.getMessage());
        } catch (UnsupportedEncodingException e) {
            logger.error("Could not encode user", e);
            status.setCode(Status.STATUS_BAD_REQUEST, e.getMessage());
        }
        model.put("name", user);

        return model;
    }

    /**
     * Sets the connector service
     *
     * @param connectorService the connectorService to set
     * @see org.springframework.extensions.webscripts.connector.ConnectorService
     */
    public void setConnectorService(ConnectorService connectorService) {
        this.connectorService = connectorService;
    }
}
