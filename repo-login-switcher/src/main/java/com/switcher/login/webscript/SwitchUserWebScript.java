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

import org.alfresco.repo.security.authentication.AuthenticationException;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.transaction.AlfrescoTransactionSupport;
import org.alfresco.service.cmr.security.AuthenticationService;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;
import org.springframework.extensions.webscripts.*;

import com.switcher.login.security.authentication.SwitchUserAuthenticationServiceImpl;

import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

/**
 * Web script which gives the admin ticket for the given user
 */
public class SwitchUserWebScript extends DeclarativeWebScript {

    private static final Logger logger = LogManager.getLogger(SwitchUserWebScript.class);

    private AuthenticationService authenticationService;

    /**
     * Getting the user name and the generation of the ticket with admin rights to that alfresco user.
     *
     * @param req    Web Script request
     * @param status Web Script status
     * @param cache  Web Script cache
     * @return custom service model
     */
    @Override
    protected Map<String, Object> executeImpl(WebScriptRequest req, Status status, Cache cache) {

        // extract username and password
        String username = req.getParameter("u");
        if (StringUtils.isBlank(username)) {
            throw new WebScriptException(HttpServletResponse.SC_BAD_REQUEST, "Username not specified");
        }

        logger.debug("UserName: " + username);

        String password = req.getParameter("pw");
        if (StringUtils.isBlank(password)) {
            throw new WebScriptException(HttpServletResponse.SC_BAD_REQUEST, "Password not specified");
        }

        logger.debug("User password: " + password);

        try {
            // save current user for future use by @see com.switcher.login.security.authentication.SwitchUserAuthenticationServiceImpl.authenticate
            AlfrescoTransactionSupport.bindResource(SwitchUserAuthenticationServiceImpl.CURRENT_USER_KEY, AuthenticationUtil.getRunAsUser());
            // get ticket
            authenticationService.authenticate(username, password.toCharArray());

            // add ticket to model for javascript and template access
            Map<String, Object> model = new HashMap<>(7, 1.0f);
            model.put("ticket", authenticationService.getCurrentTicket());

            logger.debug("Alfresco ticket: " + authenticationService.getCurrentTicket());

            return model;
        } catch (AuthenticationException e) {
            logger.error("Login failed ", e);
            throw new WebScriptException(HttpServletResponse.SC_FORBIDDEN, "Login failed");
        }

    }

    /**
     * Sets the authentication service
     *
     * @param authenticationService the authenticationService to set
     * @see org.alfresco.service.cmr.security.AuthenticationService
     */
    public void setAuthenticationService(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }
}
