package com.ahmedmusallam.selecto.util;

import com.ahmedmusallam.selecto.models.DataSourceModel;
import com.google.gson.JsonObject;
import org.apache.jackrabbit.JcrConstants;
import org.apache.jackrabbit.util.Text;
import org.apache.sling.api.adapter.Adaptable;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

public class SelectoUtil
{
	Logger logger = LoggerFactory.getLogger(getClass());

	public static Resource createUniqueChild(ResourceResolver resolver, Resource parent, String childName) throws PersistenceException
	{
		String nodeName  = Text.escapeIllegalJcrChars(childName); // excape all illegal chars
		String uniqueNodeName = ResourceUtil.createUniqueChildName(parent, nodeName); // find a unique name

		// create initial unstructured node
		Map<String,Object> properties = new HashMap<>();
		properties.put(JcrConstants.JCR_PRIMARYTYPE, JcrConstants.NT_UNSTRUCTURED );
		return resolver.create(parent , uniqueNodeName, properties);

	}

	public static Resource getOrCreateChild(ResourceResolver resolver, Resource parent, String childName) throws PersistenceException
	{
		Resource child = parent.getChild(childName);
		if(child != null) return child;

		// create does not exist, create and return it
		Map<String,Object> properties = new HashMap<>();
		properties.put(JcrConstants.JCR_PRIMARYTYPE, JcrConstants.NT_UNSTRUCTURED );
		return resolver.create(parent , childName, properties);

	}

	public static void deleteChild(ResourceResolver resolver, Resource parent, String childName, Boolean autoCommit) throws PersistenceException
	{
		Resource toBeDeleted = parent.getChild(childName);
		if(toBeDeleted != null){
			resolver.delete(toBeDeleted);
			if(autoCommit) resolver.commit();
		}
	}

	/**
	 * Converts resource children to a map with each entry having key=child name and value=child adapted
	 * @param parent the parent resource
	 * @param cls the class to adapt each child to
	 * @return a map of key=child name and value=child adapted
	 */
	public static <T> Map<String, T> getResourceChildrenMap(Resource parent, Class<T> cls){
		Iterable<Resource> children = parent.getChildren();
		Map<String, T> map = new HashMap<String, T>();
		for(Resource child: children){
			T model = child.adaptTo(cls);
			map.put(child.getName(), model);
		}
		return map;
	}

}
