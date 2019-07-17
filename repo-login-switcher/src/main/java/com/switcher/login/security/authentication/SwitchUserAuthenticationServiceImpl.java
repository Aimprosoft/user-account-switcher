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

package com.switcher.login.security.authentication;

import net.sf.acegisecurity.Authentication;
import net.sf.acegisecurity.GrantedAuthority;
import net.sf.acegisecurity.GrantedAuthorityImpl;
import net.sf.acegisecurity.UserDetails;
import net.sf.acegisecurity.context.Context;
import net.sf.acegisecurity.context.ContextHolder;
import net.sf.acegisecurity.context.security.SecureContext;
import net.sf.acegisecurity.context.security.SecureContextImpl;
import net.sf.acegisecurity.providers.UsernamePasswordAuthenticationToken;
import net.sf.acegisecurity.providers.dao.User;
import org.alfresco.repo.security.authentication.AuthenticationComponent;
import org.alfresco.repo.security.authentication.AuthenticationDisallowedException;
import org.alfresco.repo.security.authentication.AuthenticationException;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.transaction.AlfrescoTransactionSupport;
import org.alfresco.service.cmr.security.AuthenticationService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.AuthorityType;
import org.alfresco.util.EqualsHelper;
import org.alfresco.util.GUID;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 *  A class representing the admin authentication as a given alfresco member.
 *  <p>
 *  Generation of ticket processed without providing password of the given user.
 * */
public class SwitchUserAuthenticationServiceImpl implements AuthenticationService, ApplicationContextAware {

    public static final String CURRENT_USER_KEY = "SwitchUserAuthenticationService.currentUser";

    private AuthenticationComponent authenticationComponent;

    private static final Logger logger = LogManager.getLogger(SwitchUserAuthenticationServiceImpl.class);

    private static final String NAME_GROUP_ALFRESCO_ADMINISTRATORS = "GROUP_ALFRESCO_ADMINISTRATORS";

    private AuthorityService authorityService;

    private Map<String, String> userToTicket = new HashMap<>();

    public SwitchUserAuthenticationServiceImpl() {
    }

    /**
     * Is an authentication enabled or disabled?
     *
     * @param userName the name of the user
     * @return Returns <tt>true</tt> if authentication is enabled
     */
    public boolean getAuthenticationEnabled(String userName) {
        return AuthenticationUtil.getAdminUserName().equals(userName);
    }

    /**
     * Authenticate as the guest user. This may not be allowed and throw an exception.
     *
     * @throws AuthenticationException
     */
    public void authenticateAsGuest() throws AuthenticationException {
        throw new AuthenticationException("Guest access denied");
    }

    /**
     * Check if Guest user authentication is allowed.
     *
     * @return Returns <tt>true</tt> if Guest user authentication is allowed, false otherwise
     */
    public boolean guestUserAuthenticationAllowed() {
        return Boolean.FALSE;
    }

    /**
     * Check if the given authentication exists.
     *
     * @param userName the username
     * @return Returns <tt>true</tt> if the authentication exists
     */
    public boolean authenticationExists(String userName) {
        return getAuthenticationEnabled(userName);
    }

    /**
     * Get the name of the currently authenticated user.
     *
     * @return Returns the name of the current user
     * @throws AuthenticationException
     */
    public String getCurrentUserName() throws AuthenticationException {
        Context context = ContextHolder.getContext();
        if ((context == null) || !(context instanceof SecureContext)) {
            return null;
        }
        return getUserName(((SecureContext) context).getAuthentication());
    }

    /**
     * Get the name of the user from given authentication object.
     *
     * @return Returns the name of the user
     */
    private String getUserName(Authentication authentication) {
        String username = authentication.getPrincipal().toString();

        if (authentication.getPrincipal() instanceof UserDetails) {
            username = ((UserDetails) authentication.getPrincipal()).getUsername();
        }

        return username;
    }

    /**
     * Invalidate any tickets held by the user.
     *
     * @param userName the name of the user
     * @throws AuthenticationException
     */
    public void invalidateUserSession(String userName) throws AuthenticationException {
        userToTicket.remove(userName);
    }

    /**
     * Invalidate a single ticket by ID
     *
     * @param ticket alfresco ticket
     * @throws AuthenticationException
     */
    public void invalidateTicket(String ticket) throws AuthenticationException {
        String userToRemove = null;
        for (String user : userToTicket.keySet()) {
            String currentTicket = userToTicket.get(user);
            if (EqualsHelper.nullSafeEquals(currentTicket, ticket)) {
                userToRemove = user;
            }
        }
        if (userToRemove != null) {
            userToTicket.remove(userToRemove);
        }
    }

    /**
     * Validate a ticket. Set the current user name accordingly.
     *
     * @param ticket alfresco ticket
     * @throws AuthenticationException
     */
    public void validate(String ticket) throws AuthenticationException {
        String userToSet = null;
        for (String user : userToTicket.keySet()) {
            String currentTicket = userToTicket.get(user);
            if (EqualsHelper.nullSafeEquals(currentTicket, ticket)) {
                userToSet = user;
            }
        }
        if (userToSet != null) {
            setCurrentUser(userToSet);
        } else {
            throw new AuthenticationException("Invalid ticket");
        }
    }

    /**
     * Get the current ticket as a string
     *
     * @return Returns the alfresco ticket
     */
    public String getCurrentTicket() {
        String currentUser = getCurrentUserName();
        String ticket = userToTicket.get(currentUser);
        if (ticket == null) {
            ticket = GUID.generate();
            userToTicket.put(currentUser, ticket);
        }
        return ticket;
    }

    /**
     * Get a new ticket as a string
     *
     * @return Returns the alfresco ticket
     */
    public String getNewTicket() {
        return getCurrentTicket();
    }

    /**
     * Remove the current security information
     */
    public void clearCurrentSecurityContext() {
        ContextHolder.setContext(null);
    }

    /**
     * Is the current user the system user?
     *
     * @return Returns <tt>true</tt> if the current user is the system user
     */
    public boolean isCurrentUserTheSystemUser() {
        String userName = getCurrentUserName();
        return (userName != null) && userName.equals(AuthenticationUtil.getSystemUserName());
    }

    /**
     * Get the domain to which this instance of an authentication service applies.
     *
     * @return The domain name
     */
    public Set<String> getDomains() {
        return Collections.<String>emptySet();
    }

    /**
     * Does this instance alow user to be created?
     *
     * @return The domains
     */
    public Set<String> getDomainsThatAllowUserCreation() {
        return Collections.<String>emptySet();
    }

    /**
     * Does this instance allow users to be deleted?
     *
     * @return The domains
     */
    public Set<String> getDomainsThatAllowUserDeletion() {
        return Collections.<String>emptySet();
    }

    /**
     * Does this instance allow users to update their passwords?
     *
     * @return The domains
     */
    public Set<String> getDomiansThatAllowUserPasswordChanges() {
        return Collections.<String>emptySet();
    }

    /**
     * Explicitly set the current user to be authenticated.
     *
     * @param userName String
     * @return Authentication
     * @throws AuthenticationException
     */
    public Authentication setCurrentUser(String userName) throws AuthenticationException {
        if (userName == null) {
            throw new AuthenticationException("Null user name");
        }

        try {
            UserDetails ud = null;
            if (userName.equals(AuthenticationUtil.getSystemUserName())) {
                GrantedAuthority[] gas = new GrantedAuthority[1];
                gas[0] = new GrantedAuthorityImpl("ROLE_SYSTEM");
                ud = new User(AuthenticationUtil.getSystemUserName(), "", true, true, true, true, gas);
            } else if (userName.equalsIgnoreCase(AuthenticationUtil.getGuestUserName())) {
                GrantedAuthority[] gas = new GrantedAuthority[0];
                ud = new User(AuthenticationUtil.getGuestUserName().toLowerCase(), "", true, true, true, true, gas);
            } else {
                ud = getUserDetails(userName);
            }

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(ud, "", ud
                    .getAuthorities());
            auth.setDetails(ud);
            auth.setAuthenticated(true);
            return setCurrentAuthentication(auth);
        } catch (net.sf.acegisecurity.AuthenticationException ae) {
            throw new AuthenticationException(ae.getMessage(), ae);
        }
    }

    /**
     * Default implementation that makes an ACEGI object on the fly
     *
     * @param userName The name of the user
     * @return UserDetails
     */
    protected UserDetails getUserDetails(String userName) {

        GrantedAuthority[] gas = new GrantedAuthority[]{new GrantedAuthorityImpl("ROLE_AUTHENTICATED")};

        return new User(userName, "", true, true, true, true, gas);
    }

    /**
     * Explicitly set the current authentication object.
     *
     * @param authentication authentication object
     * @return Authentication
     */
    public Authentication setCurrentAuthentication(Authentication authentication) {
        Context context = ContextHolder.getContext();
        SecureContext sc = null;
        if ((context == null) || !(context instanceof SecureContext)) {
            sc = new SecureContextImpl();
            ContextHolder.setContext(sc);
        } else {
            sc = (SecureContext) context;
        }
        authentication.setAuthenticated(true);
        sc.setAuthentication(authentication);
        return authentication;
    }

    /**
     * Gets a set of user names who should be considered 'administrators' by default.
     *
     * @return Returns a set of user names
     */
    public Set<String> getDefaultAdministratorUserNames() {
        return Collections.singleton(AuthenticationUtil.getAdminUserName());
    }

    /**
     * Gets a set of user names who should be considered 'guests' by default.
     *
     * @return Returns a set of user names
     */
    public Set<String> getDefaultGuestUserNames() {
        return Collections.<String>emptySet();
    }

    /**
     * Carry out an authentication attempt. If successful the admin is logged in under the selected user.
     *
     * @param userName the username
     * @param password the password
     * @throws AuthenticationException
     */
    @Override
    public void authenticate(String userName, char[] password) throws AuthenticationException {

        // retrieve current user
        final String currentUser = AuthenticationUtil.getFullyAuthenticatedUser() == null ?
                (String) AlfrescoTransactionSupport.getResource(CURRENT_USER_KEY) : AuthenticationUtil.getFullyAuthenticatedUser();

        logger.debug("--- Current user: " + currentUser);

        // if current user is Admin (in group "GROUP_ALFRESCO_ADMINISTRATORS") - true, else - false
        boolean isAdmin = AuthenticationUtil.runAsSystem(new AuthenticationUtil.RunAsWork<Boolean>() {
            @Override
            public Boolean doWork() throws Exception {
                return authorityService.getContainedAuthorities(AuthorityType.USER, NAME_GROUP_ALFRESCO_ADMINISTRATORS, true).contains(currentUser);
            }
        });

        logger.debug("--- Current user is admin (in group " + NAME_GROUP_ALFRESCO_ADMINISTRATORS + "): " + isAdmin);

        // authenticate admin as selected user
        if (StringUtils.isNotBlank(currentUser) && isAdmin) {

            setCurrentUser(userName);

            authenticationComponent.setCurrentUser(userName);

        } else {
            throw new AuthenticationDisallowedException("Only admin user can authenticate");
        }

    }

    /**
     * Need to use global authenticationComponent instead of the local in order to access LDAP synchronized users.
     * The local authenticationComponent only handled the local users managed by alfrescoNtlm.
     * The global authenticationComponent iterate on all declared subsystems to find the user.
     */
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
    	authenticationComponent = (AuthenticationComponent) applicationContext.getParent().getBean("authenticationComponent");
    }

    public void setAuthorityService(AuthorityService authorityService) {
        this.authorityService = authorityService;
    }

}
