# **Description**
Additional page on administration tools page. Allows user with admin permissions login under another account registered in alfresco without knowing his/her password. Admin sees table with all user logins. He can select user login and click on Switch User action button. After this action, admin will be redirected to user home page. Security context will be replaced with choosen user.

# **Installation**
- Build 2 amps using maven build files under repo-login-switcher and share-login-switcher:
  * ./repo-login-switcher mvn clean package
  * ./share-login-switcher mvn clean package
- Copy files from target folders:
  * Copy repo-login-switcher.amp into {alfresco_installation_folder}/amps 
  * Copy share-login-switcher.amp into {alfresco_installation_folder}/amps_share 
- Apply amps using standard shell script 
  * {alfresco_installation_folder}/bin/apply_amps.sh for linux
  * {alfresco_installation_folder}/bin/apply_amps.bat for windows
- Start alfresco

# **Fork**
We added new branch (master-4.2.f) adapted for alfresco 4.2.f