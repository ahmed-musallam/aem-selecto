package com.ahmedmusallam.selecto.models;

import com.ahmedmusallam.selecto.util.SelectoUtil;
import com.google.gson.annotations.Expose;
import org.apache.sling.api.resource.*;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import java.util.List;

@Model(adaptables = Resource.class, defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class DataSourceModel
{
	Logger logger = LoggerFactory.getLogger(getClass());
	public static final String OPTIONS_CHILD_NAME = "options";

	@Inject @Expose
	private List<DataSourceOptionModel> options;

	@Inject
	private ResourceResolver resolver;

	@Self
	private Resource resource;

	public List<DataSourceOptionModel> getOptions() { return options; }

	public void setOptions(List<DataSourceOptionModel> opts){
		options = opts;

	}

	public void persist(){
		for (DataSourceOptionModel opt : options) {
			addOption(opt.getText(), opt.getValue());
		}
	}

	public void addOption(String text, String value)
	{
		try {
			Resource options = SelectoUtil.getOrCreateChild(resolver, resource, OPTIONS_CHILD_NAME);
			Resource optionResource = SelectoUtil.createUniqueChild(resolver, options, value);
			DataSourceOptionModel dsOption = optionResource.adaptTo(DataSourceOptionModel.class);
			dsOption.setText(text);
			dsOption.setValue(value);
			dsOption.persist(); // persist the option properties
		}
		catch (PersistenceException e){
			logger.error("Could not create the option "+text, e);
		}

	}
}
