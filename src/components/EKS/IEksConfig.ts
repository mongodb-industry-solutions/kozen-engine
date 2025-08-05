import { IStruct } from "../../models/Types";

export interface IEksConfig extends IStruct {
  message?: string;
  vpcId?: string;
  privateSubnetIds?: string[];
  instanceType?: string;
  desiredCapacity?: number;
  minSize?: number;
  maxSize?: number;
  version?: string;
  enabledClusterLogTypes?: string[];
  publicSubnetIds?: string[];
  nodeAssociatePublicIpAddress?: boolean;
  skipDefaultNodeGroup?: boolean;
  nodeGroupOptions?: any;
  tags?: { [key: string]: string };
  roleMappings?: any[];
  userMappings?: any[];
  fargate?: boolean;
  encryptionConfigKeyArn?: string;
  endpointPrivateAccess?: boolean;
  endpointPublicAccess?: boolean;
  clusterSecurityGroup?: any;
  nodeSecurityGroupTags?: { [key: string]: string };

  clusterRoleName?: string;
  nodeRoleName?: string;
}