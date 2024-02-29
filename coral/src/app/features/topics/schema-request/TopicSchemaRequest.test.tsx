import * as ReactQuery from "@tanstack/react-query";
import { waitFor, within } from "@testing-library/react";
import {
  cleanup,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react/pure";
import { userEvent } from "@testing-library/user-event";
import { TopicSchemaRequest } from "src/app/features/topics/schema-request/TopicSchemaRequest";
import { getAllEnvironmentsForTopicAndAcl } from "src/domain/environment";
import { createMockEnvironmentDTO } from "src/domain/environment/environment-test-helper";
import { requestSchemaCreation } from "src/domain/schema-request";
import { getTopicNames } from "src/domain/topic";
import { customRender } from "src/services/test-utils/render-with-wrappers";
import { KlawApiError } from "src/services/api";

jest.mock("src/domain/schema-request/schema-request-api.ts");
jest.mock("src/domain/environment/environment-api.ts");
jest.mock("src/domain/topic/topic-api.ts");

const mockGetAllEnvironmentsForTopicAndAcl =
  getAllEnvironmentsForTopicAndAcl as jest.MockedFunction<
    typeof getAllEnvironmentsForTopicAndAcl
  >;
const mockCreateSchemaRequest = requestSchemaCreation as jest.MockedFunction<
  typeof requestSchemaCreation
>;
const mockGetTopicNames = getTopicNames as jest.MockedFunction<
  typeof getTopicNames
>;

const mockedUsedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedUsedNavigate,
}));

const mockedUseToast = jest.fn();
jest.mock("@aivenio/aquarium", () => ({
  ...jest.requireActual("@aivenio/aquarium"),
  useToast: () => mockedUseToast,
}));

const useQuerySpy = jest.spyOn(ReactQuery, "useQuery");

const testTopicName = "my-awesome-topic";

const mockedEnvironments = [
  { name: "DEV", id: "1", associatedEnv: { id: "3", name: "DEV_SCH" } },
  { name: "TST", id: "2", associatedEnv: { id: "9", name: "TST_SCH" } },
  { name: "INFRA", id: "3", associatedEnv: { id: "9", name: "INFRA_SCH" } },
  { name: "SOME", id: "3", associatedEnv: undefined },
];
const mockedGetAllEnvironmentsForTopicAndAclResponse = mockedEnvironments.map(
  (entry) => {
    return createMockEnvironmentDTO(entry);
  }
);

const fileName = "my-awesome-schema.avsc";
const testFile: File = new File(["{}"], fileName, {
  type: "image/jpeg",
});

describe("TopicSchemaRequest", () => {
  const user = userEvent.setup();
  const getForm = () => {
    return screen.getByRole("form", {
      name: `Request a new schema`,
    });
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checks if topicName passed from url is part of topics user can request schemas for", () => {
    beforeEach(() => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue(
        mockedGetAllEnvironmentsForTopicAndAclResponse
      );
      mockCreateSchemaRequest.mockImplementation(jest.fn());
    });

    afterEach(() => {
      cleanup();
      useQuerySpy.mockRestore();
    });

    it("does not redirect user if topicName prop does is part of list of topicNames", async () => {
      mockGetTopicNames.mockResolvedValue([
        "topic-1",
        "topic-2",
        testTopicName,
      ]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
      });

      const form = getForm();
      expect(form).toBeVisible();

      // only testing this would always return green - even waitFor will return always
      // true, since the mock is not called directly, so waitFor will check, confirm
      // it has not been called because it has not happened yet. Checking for the
      // form makes implicitly sure that navigate was not called (otherwise no form)
      // and this assertion is mostly for readability
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });

    it("redirects user if topicName prop does not exist in list of topicNames", async () => {
      mockGetTopicNames.mockResolvedValue(["topic-1", "topic-2"]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
      });

      await waitFor(() => {
        expect(mockedUsedNavigate).toHaveBeenCalledWith(-1);
      });
    });
  });

  describe("checks if env passed from url is part of environments for a schema", () => {
    beforeEach(() => {
      mockGetTopicNames.mockResolvedValue([testTopicName]);
      mockCreateSchemaRequest.mockImplementation(jest.fn());
    });

    afterEach(() => {
      cleanup();
      useQuerySpy.mockRestore();
    });

    it("does not redirect user if env ID query is part of list of environments", async () => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue([
        ...mockedGetAllEnvironmentsForTopicAndAclResponse,
      ]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
        customRoutePath: "/topic/testtopic/request-schema?env=1",
      });

      const form = getForm();
      expect(form).toBeVisible();

      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });

      expect(select).toBeDisabled();
      expect(select).toHaveValue("1");
      await waitFor(() => expect(select).toHaveDisplayValue("DEV"));

      // only testing this would always return green - even waitFor will return always
      // true, since the mock is not called directly, so waitFor will check, confirm
      // it has not been called because it has not happened yet. Checking for the
      // form makes implicitly sure that navigate was not called (otherwise no form)
      // and this assertion is mostly for readability
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });

    it("does not redirect user if env name query is part of list of environments", async () => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue([
        ...mockedGetAllEnvironmentsForTopicAndAclResponse,
      ]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
        customRoutePath: "/topic/testtopic/request-schema?env=INFRA",
      });

      const form = getForm();
      expect(form).toBeVisible();

      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });

      expect(select).toBeDisabled();
      await waitFor(() => expect(select).toHaveValue("3"));
      await waitFor(() => expect(select).toHaveDisplayValue("INFRA"));

      // only testing this would always return green - even waitFor will return always
      // true, since the mock is not called directly, so waitFor will check, confirm
      // it has not been called because it has not happened yet. Checking for the
      // form makes implicitly sure that navigate was not called (otherwise no form)
      // and this assertion is mostly for readability
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });

    it("redirects user if env id query does not exist in list of environments", async () => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue([
        ...mockedGetAllEnvironmentsForTopicAndAclResponse,
      ]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
        customRoutePath: "/topic/testtopic/request-schema?env=999",
      });

      await waitFor(() => {
        expect(mockedUsedNavigate).toHaveBeenCalledWith(-1);
      });
    });

    it("redirects user if env name query does not exist in list of environments", async () => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue([
        ...mockedGetAllEnvironmentsForTopicAndAclResponse,
      ]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
        customRoutePath: "/topic/testtopic/request-schema?env=HELLO",
      });

      await waitFor(() => {
        expect(mockedUsedNavigate).toHaveBeenCalledWith(-1);
      });
    });
  });

  describe("handles loading and update state", () => {
    beforeAll(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      useQuerySpy.mockReturnValue({ data: [], isLoading: true });
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue([]);
      mockCreateSchemaRequest.mockImplementation(jest.fn());
      mockGetTopicNames.mockResolvedValue([testTopicName]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
      });
    });

    afterAll(() => {
      cleanup();
      useQuerySpy.mockRestore();
    });

    it("shows a form to request a schema", () => {
      const form = getForm();

      expect(form).toBeVisible();
    });

    it("shows a loading element while Environments are being fetched", () => {
      const form = getForm();
      const loadingEnvironments = within(form).getByTestId(
        "async-select-loading-environments"
      );

      expect(loadingEnvironments).toBeVisible();
    });
  });

  describe("renders all necessary elements", () => {
    beforeAll(async () => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue(
        mockedGetAllEnvironmentsForTopicAndAclResponse
      );
      mockCreateSchemaRequest.mockImplementation(jest.fn());
      mockGetTopicNames.mockResolvedValue([testTopicName]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
      });
      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );
    });

    afterAll(() => {
      cleanup();
    });

    it("shows a form to request a schema", () => {
      const form = getForm();

      expect(form).toBeVisible();
    });

    it("shows a required select element to choose an Environment", () => {
      const form = getForm();
      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });

      expect(select).toBeEnabled();
      expect(select).toBeRequired();
    });

    it("renders all options for Environment with associated env based on api data", () => {
      const environmentsWithAssociatedEnvs = mockedEnvironments.filter(
        (env) => env.associatedEnv
      );

      const form = getForm();
      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const options = within(select).getAllByRole("option");

      expect(options).toHaveLength(environmentsWithAssociatedEnvs.length + 1);
    });

    test.each(mockedEnvironments)(
      `renders a option $name with the Environments id set as value $id when Environment has an associated env`,
      (environment) => {
        if (environment.associatedEnv) {
          const { name, id } = environment;
          const form = getForm();
          const select = within(form).getByRole("combobox", {
            name: /Environment/i,
          });
          const option = within(select).getByRole("option", { name: name });

          expect(option).toBeVisible();
          expect(option).toHaveValue(id);
        }
      }
    );

    it("shows readonly select element for the topic name", () => {
      const form = getForm();
      const select = within(form).getByRole("combobox", {
        name: "Topic name (read-only)",
      });

      expect(select).toBeVisible();
      expect(select).toBeDisabled();
      expect(select).toHaveAttribute("aria-readonly", "true");
    });

    it("sets the value for readonly select for topic name", () => {
      const form = getForm();
      const select = within(form).getByRole("combobox", {
        name: "Topic name (read-only)",
      });

      expect(select).toHaveValue(testTopicName);
    });

    it("shows a required file upload input for AVRO Schema", () => {
      const form = getForm();
      // <input type="file" /> does not have a corresponding role
      const fileUpload =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      expect(fileUpload).toBeEnabled();
      expect(fileUpload).toBeRequired();
    });

    it("shows field for schema preview", () => {
      const previewPlaceholder = screen.getByText("Preview for your schema");
      expect(previewPlaceholder).toBeVisible();
    });

    it("shows an optional text input for remarks", () => {
      const form = getForm();
      // <input type="file" /> does not have a corresponding role
      const textArea = within(form).getByRole("textbox", {
        name: "Message for approval",
      });

      expect(textArea).toBeEnabled();
      expect(textArea).not.toBeRequired();
    });

    it("shows a disabled button to submit the form", () => {
      const form = getForm();
      // <input type="file" /> does not have a corresponding role
      const button = within(form).getByRole("button", {
        name: "Submit request",
      });

      expect(button).toBeEnabled();
    });

    it("shows an enabled button to cancel form input", () => {
      const form = getForm();
      // <input type="file" /> does not have a corresponding role
      const button = within(form).getByRole("button", {
        name: "Cancel",
      });

      expect(button).toBeEnabled();
    });
  });

  describe("shows errors when user does not fill out correctly", () => {
    beforeEach(async () => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue(
        mockedGetAllEnvironmentsForTopicAndAclResponse
      );
      mockCreateSchemaRequest.mockImplementation(jest.fn());
      mockGetTopicNames.mockResolvedValue([testTopicName]);

      customRender(<TopicSchemaRequest presetTopicName={testTopicName} />, {
        queryClient: true,
        memoryRouter: true,
        aquariumContext: true,
      });
      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );
    });

    afterEach(() => {
      cleanup();
    });

    it("shows error when user does not fill out Environment select", async () => {
      const form = getForm();
      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });

      select.focus();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ESC}");
      await user.tab();

      const error = await screen.findByText(
        "Selection Error: Please select an environment"
      );
      expect(error).toBeVisible();
      expect(select).toBeInvalid();
    });

    it("shows error when user does not upload a file", async () => {
      const form = getForm();
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      fileInput.focus();
      await user.tab();

      const fileRequiredError = screen.getAllByText(
        "File missing: Upload the AVRO schema file."
      );
      expect(fileRequiredError).toHaveLength(2);
    });

    it("renders enabled Submit even if user does not fill out all fields", async () => {
      const form = getForm();
      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();

      expect(button).toBeEnabled();
    });
  });

  describe("enables user to cancel the form input", () => {
    beforeEach(async () => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue(
        mockedGetAllEnvironmentsForTopicAndAclResponse
      );
      mockCreateSchemaRequest.mockImplementation(jest.fn());
      mockGetTopicNames.mockResolvedValue([testTopicName]);

      customRender(
        <TopicSchemaRequest
          presetTopicName={testTopicName}
          schemafullValueForTest={"{}"}
        />,
        {
          queryClient: true,
          memoryRouter: true,
          aquariumContext: true,
        }
      );
      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );
    });

    afterEach(() => {
      cleanup();
    });

    it("redirects user to the previous page if they click 'Cancel' on empty form", async () => {
      const form = getForm();

      const button = within(form).getByRole("button", {
        name: "Cancel",
      });

      await user.click(button);

      expect(mockedUsedNavigate).toHaveBeenCalledWith(-1);
    });

    it('shows a warning dialog if user clicks "Cancel" and has inputs in form', async () => {
      const form = getForm();

      const remarkInput = screen.getByRole("textbox", {
        name: "Message for approval",
      });
      await user.type(remarkInput, "Important information");

      const button = within(form).getByRole("button", {
        name: "Cancel",
      });

      await user.click(button);
      const dialog = screen.getByRole("dialog");

      expect(dialog).toBeVisible();
      expect(dialog).toHaveTextContent("Cancel schema request?");
      expect(dialog).toHaveTextContent(
        "Do you want to cancel this request? The data added will be lost."
      );

      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });

    it("brings the user back to the form when they do not cancel", async () => {
      const form = getForm();

      const remarkInput = screen.getByRole("textbox", {
        name: "Message for approval",
      });
      await user.type(remarkInput, "Important information");

      const button = within(form).getByRole("button", {
        name: "Cancel",
      });

      await user.click(button);
      const dialog = screen.getByRole("dialog");

      const returnButton = screen.getByRole("button", {
        name: "Continue with request",
      });

      await user.click(returnButton);

      expect(mockedUsedNavigate).not.toHaveBeenCalled();

      expect(dialog).not.toBeInTheDocument();
    });

    it("redirects user to previous page if they cancel the request", async () => {
      const form = getForm();

      const remarkInput = screen.getByRole("textbox", {
        name: "Message for approval",
      });
      await user.type(remarkInput, "Important information");

      const button = within(form).getByRole("button", {
        name: "Cancel",
      });

      await user.click(button);

      const returnButton = screen.getByRole("button", {
        name: "Cancel request",
      });

      await user.click(returnButton);

      expect(mockedUsedNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe("handles errors from the api", () => {
    const originalConsoleError = console.error;

    beforeEach(async () => {
      console.error = jest.fn();
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue(
        mockedGetAllEnvironmentsForTopicAndAclResponse
      );
      mockCreateSchemaRequest.mockRejectedValue({
        status: "400 BAD_REQUEST",
        data: { message: "Error in request" },
      });
      mockGetTopicNames.mockResolvedValue([testTopicName]);

      customRender(
        <TopicSchemaRequest
          presetTopicName={testTopicName}
          schemafullValueForTest={"{}"}
        />,
        {
          queryClient: true,
          memoryRouter: true,
          aquariumContext: true,
        }
      );
      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );
    });

    afterEach(() => {
      console.error = originalConsoleError;
      cleanup();
    });

    it("shows an alert informing user about the error ", async () => {
      const form = getForm();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);
      await user.click(button);

      expect(mockCreateSchemaRequest).toHaveBeenCalled();

      const alert = await screen.findByRole("alert");
      const errorMessage = within(alert).getByText("Error in request");

      expect(errorMessage).toBeVisible();
      // it's not important that the console.error is called,
      // but it makes sure that 1) the console.error does not
      // show up in the test logs while 2) flagging an error
      // in case a console.error with a different message
      // gets called - which could be hinting to a problem
      expect(console.error).toHaveBeenCalledWith({
        status: "400 BAD_REQUEST",
        data: { message: "Error in request" },
      });
    });

    it("does not redirect the user if the request failed", async () => {
      const form = getForm();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);
      await user.click(button);

      await waitFor(() =>
        expect(screen.getByText("Error in request")).toBeVisible()
      );

      expect(mockedUsedNavigate).not.toHaveBeenCalled();

      expect(console.error).toHaveBeenCalledWith({
        status: "400 BAD_REQUEST",
        data: { message: "Error in request" },
      });
    });
  });

  describe("enables user to send a schema request", () => {
    beforeEach(async () => {
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue(
        mockedGetAllEnvironmentsForTopicAndAclResponse
      );
      mockCreateSchemaRequest.mockResolvedValue({
        success: true,
        message: "",
      });
      mockGetTopicNames.mockResolvedValue([testTopicName]);

      customRender(
        <TopicSchemaRequest
          presetTopicName={testTopicName}
          schemafullValueForTest={"{}"}
        />,
        {
          queryClient: true,
          memoryRouter: true,
          aquariumContext: true,
        }
      );
      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );
    });

    afterEach(() => {
      mockedUseToast.mockReset();
      cleanup();
    });

    it("enables user to select an environment", async () => {
      const form = getForm();
      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[1].name,
      });

      expect(select).toHaveDisplayValue("-- Please select --");

      await user.selectOptions(select, option);

      expect(select).toHaveValue(mockedEnvironments[1].id);
      expect(select).toHaveDisplayValue(mockedEnvironments[1].name);
    });

    it("enables user to upload a file", async () => {
      const form = getForm();
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      expect(fileInput.files?.[0]).toBeUndefined();

      await user.upload(fileInput, testFile);

      expect(fileInput.files?.[0]).toBe(testFile);
    });

    it("shows file content in a preview editor", async () => {
      const form = getForm();
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      await user.upload(fileInput, testFile);
      const editor = await screen.findByTestId("topic-schema");

      await waitFor(() => expect(editor).toHaveDisplayValue("{}"));
    });

    it("enables the submit button if user filled all required inputs", async () => {
      const form = getForm();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);

      expect(button).toBeEnabled();
    });

    it("submits on button click after user filled all required inputs", async () => {
      const form = getForm();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);
      await user.click(button);

      expect(mockCreateSchemaRequest).toHaveBeenCalledWith({
        environment: "1",
        remarks: "",
        schemafull: "{}",
        topicname: "my-awesome-topic",
        schemaType: "AVRO",
      });
      await waitFor(() => expect(mockedUseToast).toHaveBeenCalled());
    });

    it("allows users to submit JSON type schemas", async () => {
      const form = getForm();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();

      const jsonRadio = within(form).getByRole("radio", { name: "JSON" });

      await user.click(jsonRadio);
      await user.upload(fileInput, testFile);
      await user.click(button);

      expect(mockCreateSchemaRequest).toHaveBeenCalledWith({
        environment: "1",
        remarks: "",
        schemafull: "{}",
        topicname: "my-awesome-topic",
        schemaType: "JSON",
      });
      await waitFor(() => expect(mockedUseToast).toHaveBeenCalled());
    });

    it("does not submit on button click if user did not fill all required inputs", async () => {
      const form = getForm();

      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.upload(fileInput, testFile);

      expect(button).toBeEnabled();
      await user.click(button);
      await user.tab();

      expect(mockCreateSchemaRequest).not.toHaveBeenCalled();
      expect(mockedUseToast).not.toHaveBeenCalled();
    });

    it("shows a notification informing user that schema request was successful and redirects them", async () => {
      const form = getForm();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);
      await user.click(button);

      expect(mockCreateSchemaRequest).toHaveBeenCalled();
      await waitFor(() =>
        expect(mockedUseToast).toHaveBeenCalledWith({
          message: "Schema request successfully created",
          position: "bottom-left",
          variant: "default",
        })
      );
      expect(mockedUsedNavigate).toHaveBeenCalledWith(
        "/requests/schemas?status=CREATED"
      );
    });
  });

  describe("handles errors when creating the schema request fails", () => {
    const testError: KlawApiError = {
      success: false,
      message: "Oh no 😢",
    };

    const originalConsoleError = console.error;
    beforeEach(async () => {
      console.error = jest.fn();
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue(
        mockedGetAllEnvironmentsForTopicAndAclResponse
      );
      mockGetTopicNames.mockResolvedValue([testTopicName]);
      mockCreateSchemaRequest.mockRejectedValue(testError);

      customRender(
        <TopicSchemaRequest
          presetTopicName={testTopicName}
          schemafullValueForTest={"{}"}
        />,
        {
          queryClient: true,
          memoryRouter: true,
          aquariumContext: true,
        }
      );
      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );
    });

    afterEach(() => {
      console.error = originalConsoleError;
      mockedUseToast.mockReset();
      cleanup();
    });

    it("shows a error message informing user that schema request failed", async () => {
      const form = getForm();
      const alertBefore = screen.queryByRole("alert");
      expect(alertBefore).not.toBeInTheDocument();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const button = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(button).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);
      await user.click(button);

      expect(mockCreateSchemaRequest).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(testError);

      const errorAlert = screen.getByRole("alert");
      expect(errorAlert).toBeVisible();
      expect(errorAlert).toHaveTextContent(testError.message);

      expect(mockedUsedNavigate).not.toHaveBeenCalled();
      expect(mockedUseToast).not.toHaveBeenCalled();
    });
  });

  describe("enables user to send a schema request even if it's not compatible", () => {
    const originalConsoleError = console.error;

    beforeEach(async () => {
      console.error = jest.fn();
      mockGetAllEnvironmentsForTopicAndAcl.mockResolvedValue(
        mockedGetAllEnvironmentsForTopicAndAclResponse
      );
      mockGetTopicNames.mockResolvedValue([testTopicName]);

      // The first response to the test should be the compatibility error
      // second response will be the success
      mockCreateSchemaRequest
        .mockRejectedValueOnce({
          success: false,
          message: "failure: Schema is not compatible",
        })
        .mockResolvedValue({
          success: true,
          message: "",
        });

      customRender(
        <TopicSchemaRequest
          presetTopicName={testTopicName}
          schemafullValueForTest={"{}"}
        />,
        {
          queryClient: true,
          memoryRouter: true,
          aquariumContext: true,
        }
      );
      await waitForElementToBeRemoved(
        screen.getAllByTestId(/async-select-loading/)
      );
    });

    afterEach(() => {
      console.error = originalConsoleError;
      mockedUseToast.mockReset();
      cleanup();
    });

    it("gives user the option to force register with a warning information", async () => {
      const form = getForm();

      const checkBoxBefore = within(form).queryByRole("checkbox", {
        name: "Force register Overrides standard validation processes of the schema registry.",
      });

      const warningBefore = screen.queryByText("alertdialog");
      expect(checkBoxBefore).not.toBeInTheDocument();
      expect(warningBefore).not.toBeInTheDocument();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const submitButton = within(form).getByRole("button", {
        name: "Submit request",
      });

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);
      await user.click(submitButton);

      const warningForceRegister = screen.getByRole("alert");
      const checkboxForceRegister = within(form).getByRole("checkbox", {
        name: "Force register schema creation/changes Warning: This will override standard validation process of the schema registry. Learn more",
      });

      expect(warningForceRegister).toBeVisible();
      expect(warningForceRegister).toHaveTextContent(
        "Uploaded schema appears invalid."
      );
      expect(checkboxForceRegister).toBeEnabled();
      expect(console.error).toHaveBeenCalledWith({
        message: "failure: Schema is not compatible",
        success: false,
      });
    });

    it("enables user to only send the request if they confirm force register", async () => {
      const form = getForm();
      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);

      const submitButton = within(form).getByRole("button", {
        name: "Submit request",
      });
      expect(submitButton).toBeEnabled();

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);
      await user.click(submitButton);

      const checkboxForceRegister = within(form).getByRole("checkbox", {
        name: "Force register schema creation/changes Warning: This will override standard validation process of the schema registry. Learn more",
      });

      expect(submitButton).toHaveAccessibleName(
        "Submit request to force register"
      );
      expect(submitButton).toBeDisabled();

      await user.click(checkboxForceRegister);
      expect(submitButton).toBeEnabled();
    });

    it("shows a notification informing user that force register for schema request was successful and redirects them", async () => {
      const form = getForm();

      const select = within(form).getByRole("combobox", {
        name: /Environment/i,
      });
      const option = within(select).getByRole("option", {
        name: mockedEnvironments[0].name,
      });
      const fileInput =
        within(form).getByLabelText<HTMLInputElement>(/Upload AVRO Schema/i);
      const submitButton = within(form).getByRole("button", {
        name: "Submit request",
      });

      await user.selectOptions(select, option);
      await user.tab();
      await user.upload(fileInput, testFile);
      await user.click(submitButton);

      const checkboxForceRegister = within(form).getByRole("checkbox", {
        name: "Force register schema creation/changes Warning: This will override standard validation process of the schema registry. Learn more",
      });

      expect(submitButton).toBeDisabled();
      await user.click(checkboxForceRegister);

      expect(submitButton).toBeEnabled();
      await user.click(submitButton);

      expect(mockCreateSchemaRequest).toHaveBeenNthCalledWith(2, {
        forceRegister: true,
        environment: "1",
        remarks: "",
        schemafull: "{}",
        topicname: "my-awesome-topic",
        schemaType: "AVRO",
      });

      await waitFor(() =>
        expect(mockedUseToast).toHaveBeenCalledWith({
          message: "Schema request successfully created",
          position: "bottom-left",
          variant: "default",
        })
      );
      expect(mockedUsedNavigate).toHaveBeenCalledWith(
        "/requests/schemas?status=CREATED"
      );
    });
  });
});
