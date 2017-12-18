package com.ahmedmusallam.selecto.servlets;

import com.ahmedmusallam.selecto.models.DataSourceModel;
import com.ahmedmusallam.selecto.models.DataSourceOptionModel;
import com.ahmedmusallam.selecto.util.SelectoUtil;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.lang.reflect.Type;
import com.adobe.granite.rest.Constants;
import java.util.List;
import java.util.Map;

@Component(
		immediate = true,
		service = Servlet.class,
		property = {
				"sling.servlet.extensions=servlet",
				"sling.servlet.paths=/bin/selecto",
				"sling.servlet.methods=get",
				"sling.servlet.methods=put",
				"sling.servlet.methods=post",
				"sling.servlet.methods=delete"
		},
		configurationPid = "com.ahmedmusallam.selecto.servlets.DataSourceServlet"
)
@Designate(ocd=DataSourceServlet.Configuration.class)
public class DataSourceServlet extends SlingAllMethodsServlet
{
	Logger logger = LoggerFactory.getLogger(getClass());

	private static final long serialVersionUID = 1L;
	private static final String DATASOURCE_PATH_SELECTOR = "data-source-selector";

	private String dataSourcePath;

	/**
	 * Get one or all datasources
	 * Gets the options for one datasource if an id selector is passed
	 * Gets all datasources if no selector is passed
	 * @param req
	 * @param resp
	 * @throws ServletException
	 * @throws IOException
	 */
	@Override
	protected void doGet(final SlingHttpServletRequest req,
						 final SlingHttpServletResponse resp) throws ServletException, IOException
	{
		ResourceResolver resolver = req.getResourceResolver();
		String firstSelector = getFirstSelector(req);
		Resource dataSourceParentResource = getDataSourceResource(req);
		Gson gson = getGson();
		String responseStr = "{}";

		if(DATASOURCE_PATH_SELECTOR.equals(firstSelector)){ // request to get the path to datasources
			JsonObject pathObject = new JsonObject();
			pathObject.addProperty("path", dataSourcePath );
			responseStr = pathObject.toString();
		}
		else if (firstSelector == null) { // get all DataSources
			Map<String, DataSourceModel> map = SelectoUtil.getResourceChildrenMap(dataSourceParentResource, DataSourceModel.class);
			responseStr = gson.toJson(map);
		}
		else { // get one DataSources with id
			Resource dataSource = dataSourceParentResource.getChild(firstSelector); // first selector is the id
			if(null != dataSource) responseStr = gson.toJson(dataSource.adaptTo(DataSourceModel.class));
		}

		resp.setContentType(Constants.CT_JSON);
		getWriter(resp).write(responseStr);

	}

	/**
	 * Add new DataSource
	 * @param req
	 * @param resp
	 * @throws ServletException
	 * @throws IOException
	 */
	@Override
	protected void doPut(final SlingHttpServletRequest req,
							final SlingHttpServletResponse resp) throws ServletException, IOException{
		ResourceResolver resolver = req.getResourceResolver();
		String dsId = getFirstSelector(req);
		Resource dataSourceParent = getDataSourceResource(req);
		Resource dataSourceResource = SelectoUtil.createUniqueChild(resolver, dataSourceParent, dsId );
		String body = readRequestBody(req);
		logger.debug("PUT request to create new DS: "+body);
		Gson gson = getGson();
		Type collectionType = new TypeToken<List<DataSourceOptionModel>>(){}.getType();
		List<DataSourceOptionModel> options = gson.fromJson(body, collectionType);
		DataSourceModel dataSource = dataSourceResource.adaptTo(DataSourceModel.class);
		dataSource.setOptions(options); // set the options
		dataSource.persist(); // store the option nodes

		try { resolver.commit(); } // we have to commit the resolver to persist the data to JCR
		catch (PersistenceException e){
			logger.error("Could not save the DataSource", e);
			String errorJson = getErrorJson(gson, "Server Error", "Could not save DataSource");
			resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, errorJson);
			return;
		}
		logger.debug("Responding with: "+ gson.toJson(dataSource));
		resp.setContentType(Constants.CT_JSON);
		getWriter(resp).write(gson.toJson(dataSource));

	}

	/**
	 * Update an existing datasource
	 * @param req
	 * @param resp
	 * @throws ServletException
	 * @throws IOException
	 */
	@Override
	protected void doPost(final SlingHttpServletRequest req,
						 final SlingHttpServletResponse resp) throws ServletException, IOException{
		ResourceResolver resolver = req.getResourceResolver();
		String dsId = getFirstSelector(req);
		Resource dataSourceParent = getDataSourceResource(req);
		Resource dataSourceResource = dataSourceParent.getChild(dsId);
		Gson gson= getGson();

		if(dataSourceResource != null){
			DataSourceModel dataSource = dataSourceResource.adaptTo(DataSourceModel.class);
			SelectoUtil.deleteChild(resolver, dataSourceResource, DataSourceModel.OPTIONS_CHILD_NAME, true);
			String body = readRequestBody(req);
			logger.debug("POST request to update existing DS: "+dsId+" with data "+ body);
			Type collectionType = new TypeToken<List<DataSourceOptionModel>>(){}.getType();			
			List<DataSourceOptionModel> options = gson.fromJson(body, collectionType);
			dataSource.setOptions(options);
			dataSource.persist();

			try { resolver.commit(); } // we have to commit the resolver to persist the data to JCR
			catch (PersistenceException e){
				logger.error("Could not update the DataSource", e);
				String errorJson = getErrorJson(gson, "Server Error", "Could not update DataSource");
				resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, errorJson);
				return;
			}

			resp.setContentType(Constants.CT_JSON);
			getWriter(resp).write(gson.toJson(dataSource));
			return;

		}
		else {
			resp.sendError(HttpServletResponse.SC_BAD_REQUEST, getErrorJson(gson, "Illegal operation", "DS "+dsId+" already exists"));
		}
	}

	/**
	 * Delete a datasource
	 * @param req
	 * @param resp
	 * @throws ServletException
	 * @throws IOException
	 */
	@Override
	protected void doDelete(final SlingHttpServletRequest req,
					   final SlingHttpServletResponse resp) throws ServletException, IOException{
		ResourceResolver resolver = req.getResourceResolver();
		String dsId = getFirstSelector(req);
		Resource dataSourceParent = getDataSourceResource(req);
		SelectoUtil.deleteChild(resolver, dataSourceParent, dsId, true);
		JsonObject json = new JsonObject();
		json.addProperty("message", "successfully deleted!");
		getWriter(resp).write(json.toString());
	}

	@Activate
	@Modified
	protected void Activate(Configuration config) {
		dataSourcePath = config.dataSourcePath();
		logger.info("DataSourceServlet is active!");
	}

	private String getFirstSelector(SlingHttpServletRequest req){
		String[] selectors = req.getRequestPathInfo().getSelectors();
		if(selectors.length > 0){
			return selectors[0];
		}
		return null;
	}

	/**
	 * Get a new cusom Gson to handle json
	 */
	private Gson getGson(){
		return new GsonBuilder().excludeFieldsWithoutExposeAnnotation().create();
	}

	/**
	 * Get request PrintWriter
	 */
	private PrintWriter getWriter(SlingHttpServletResponse resp) throws IOException{
		return resp.getWriter();
	}

	/**
	 * Creates a new error json string from title and text
	 */
	private String getErrorJson( Gson gson, String title, String text) throws IOException {
		return gson.toJson(new SelectoError(title, text));
	}

	/**
	 * Gets the datasources parent path, if does not exist, creates it
	 */
	private Resource getDataSourceResource(SlingHttpServletRequest req){
		Resource dataSourceResource = null;
		try {
			dataSourceResource = ResourceUtil.getOrCreateResource(req.getResourceResolver(), dataSourcePath, (String)null, (String)null, true);
		}
		catch(PersistenceException e){
			logger.error("Could not get or create the datasource path"+dataSourcePath, e);
		}
		return dataSourceResource;
	}

	/**
	 * Reads the request body and returns it as string
	 * @param request the request to read
	 * @return a string representation of the request body
	 */
	private String readRequestBody(SlingHttpServletRequest request) {
		try {
			// Read from request
			StringBuilder buffer = new StringBuilder();
			BufferedReader reader = new BufferedReader( new InputStreamReader(request.getInputStream()));
			String line;
			while ((line = reader.readLine()) != null) {
				buffer.append(line);
			}
			return buffer.toString();
		} catch (IOException io) {
			logger.error("Failed to read the request body from the request.", io);
		}
		return null;
	}

	@ObjectClassDefinition(name = "Annotation Demo Servlet - OSGi")
	public @interface Configuration
	{
		@AttributeDefinition(
				name = "DataSource path",
				description = "The path under which DataSources will be added, if path does not exist, it will be created",
				type = AttributeType.STRING
		)
		String dataSourcePath() default "/content/selecto";
	}

	public class SelectoError {
		private String title;
		private String text;

		public SelectoError(String title, String text){
			this.title = title;
			this.text = text;
		}
	}
}
