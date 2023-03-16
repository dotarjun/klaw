package io.aiven.klaw.model.response;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AuthenticationInfo {
  @NotNull private String contextPath;
  @NotNull private String teamsize;
  @NotNull private String schema_clusters_count;
  @NotNull private String kafka_clusters_count;
  @NotNull private String kafkaconnect_clusters_count;
  @NotNull private String canSwitchTeams;
  @NotNull private String broadcastText;
  @NotNull private String saasEnabled;
  @NotNull private String tenantActiveStatus;
  @NotNull private String username;
  @NotNull private String authenticationType;
  @NotNull private String teamname;
  @NotNull private String teamId;
  @NotNull private String tenantName;
  @NotNull private String userrole;
  @NotNull private String companyinfo;
  @NotNull private String klawversion;
  @NotNull private String notifications;
  @NotNull private String notificationsAcls;
  @NotNull private String notificationsSchemas;
  @NotNull private String notificationsUsers;
  @NotNull private String notificationsConnectors;
  @NotNull private String canShutdownKw;
  @NotNull private String canUpdatePermissions;
  @NotNull private String addEditRoles;
  @NotNull private String viewTopics;
  @NotNull private String requestItems;
  @NotNull private String viewKafkaConnect;
  @NotNull private String syncBackTopics;
  @NotNull private String syncBackAcls;
  @NotNull private String updateServerConfig;
  @NotNull private String showServerConfigEnvProperties;
  @NotNull private String addUser;
  @NotNull private String addTeams;
  @NotNull private String syncTopicsAcls;
  @NotNull private String syncConnectors;
  @NotNull private String approveAtleastOneRequest;
  @NotNull private String approveDeclineTopics;
  @NotNull private String approveDeclineSubscriptions;
  @NotNull private String approveDeclineSchemas;
  @NotNull private String approveDeclineConnectors;
  @NotNull private String pendingApprovalsRedirectionPage;
  @NotNull private String showAddDeleteTenants;
  @NotNull private String addDeleteEditClusters;
  @NotNull private String addDeleteEditEnvs;
  @NotNull private String coralEnabled;
  @NotNull private String adAuthRoleEnabled;
  @NotNull private String supportlink;
  @NotNull private String myteamtopics;
}
