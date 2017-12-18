package com.ahmedmusallam.selecto.models;

import com.google.gson.annotations.Expose;
import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Optional;
import org.apache.sling.models.annotations.injectorspecific.Self;

import javax.inject.Inject;
import javax.inject.Named;

@Model(adaptables = Resource.class)
public class DataSourceOptionModel
{
	public static final String PROP_VALUE = "value";
	public static final String PROP_TEXT = "text";

	@Inject @Optional @Named(PROP_VALUE) @Expose
	private String value;

	@Inject @Optional @Named(PROP_TEXT) @Expose
	private String text;

	@Self
	private Resource resource;

	public String getValue() {
		return value;
	}
	public String getText() {
		return text;
	}

	public void setValue(String newValue){
		value = newValue;
	}
	public void setText(String newText){
		text = newText;
	}
	public void persist(){
		ModifiableValueMap map = resource.adaptTo(ModifiableValueMap.class);
		map.put(PROP_VALUE, value);
		map.put(PROP_TEXT, text);
		// need to commit?
	}
}
