import { IResult, IStruct } from "../../../shared/models/Types";
import { IPipeline } from '../../pipeline/models/Pipeline';
import { IComponent } from "./Component";

export interface IController {
    /**
     * Configures the controller with the provided component configuration.
     * @param {IComponent} config - The component configuration object containing deployment parameters, instructions, and metadata.
     * @returns {BaseController} The configured controller instance for method chaining.
     */
    configure(config: IComponent): IController;

    /**
     * Sets up component configuration parameters for deployment.
     * @param {IStruct} [input] - Optional input parameters for setup configuration.
     * @param {IPipeline} [pipeline] - Optional pipeline context for setup.
     * @returns {Promise<IResult>} Promise resolving to configuration values or void.
     */
    setup(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;

    /**
     * Deploys the component using the current configuration.
     * Abstract method that must be implemented by concrete controller classes.
     * @param {IStruct} [input] - Optional input parameters for deployment.
     * @param {IPipeline} [pipeline] - Optional pipeline context for deployment.
     * @returns {Promise<IResult>} Promise resolving to deployment result with success status and outputs.
     * @throws {Error} When deployment fails due to configuration, network, or infrastructure errors.
     */
    deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;

    /**
     * Undeploys the component, removing all deployed resources.
     * Removes previously deployed infrastructure resources and cleans up any associated configurations.
     * @param {IStruct} [input] - Optional input parameters for undeployment.
     * @param {IPipeline} [pipeline] - Optional pipeline context for undeployment.
     * @returns {Promise<IResult | void>} Promise resolving to undeployment result or void.
     * @throws {Error} When undeployment fails due to access issues or resource dependencies.
     */
    undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void>;

    /**
     * Destroys the component and all associated resources permanently.
     * Permanently removes infrastructure resources without possibility of recovery.
     * @param {IStruct} [input] - Optional input parameters for destruction.
     * @param {IPipeline} [pipeline] - Optional pipeline context for destruction.
     * @returns {Promise<IResult | void>} Promise resolving to destruction result or void.
     * @throws {Error} When destruction fails due to access issues or resource protection.
     */
    destroy(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void>;

    /**
     * Validates the current configuration and component state.
     * Performs comprehensive validation of component configuration, dependencies, and deployment prerequisites.
     * @param {IStruct} [input] - Optional input parameters for validation.
     * @param {IPipeline} [pipeline] - Optional pipeline context for validation.
     * @returns {Promise<IResult | void>} Promise resolving to validation result or void.
     * @throws {Error} When validation encounters configuration or dependency errors.
     */
    validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void>;

    /**
     * Checks the current status of the deployed component.
     * Queries the current operational state of deployed infrastructure components, including health status and performance metrics.
     * @param {IStruct} [input] - Optional input parameters for status checking.
     * @param {IPipeline} [pipeline] - Optional pipeline context for status checking.
     * @returns {Promise<IResult | void>} Promise resolving to component status information or void.
     * @throws {Error} When status check fails due to network issues or access problems.
     */
    status(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void>;

    /**
     * Retrieves metadata describing the component.
     * Provides a detailed object containing the component's metadata, such as its configuration, properties, and dependencies.
     * @returns {Promise<IComponent>} - Promise resolving to the metadata object representing the component.
     */
    metadata(): Promise<IComponent>;
}
